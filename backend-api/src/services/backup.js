const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Database Backup Service
 * Handles automated backups with rotation
 */

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.dbPath = path.join(__dirname, '../../database/salessync.db');
    this.maxBackups = parseInt(process.env.MAX_BACKUPS || '7'); // Keep last 7 backups
    this.backupSchedule = process.env.BACKUP_SCHEDULE || '0 2 * * *'; // Daily at 2 AM
  }

  /**
   * Create a backup of the database
   */
  async createBackup() {
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });

      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `salessync-backup-${timestamp}.db`;
      const backupPath = path.join(this.backupDir, backupFilename);

      // Copy database file
      await fs.copyFile(this.dbPath, backupPath);

      // Get backup size
      const stats = await fs.stat(backupPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Create metadata file
      const metadataPath = path.join(this.backupDir, `${backupFilename}.meta.json`);
      await fs.writeFile(
        metadataPath,
        JSON.stringify({
          filename: backupFilename,
          created: new Date().toISOString(),
          size: `${sizeInMB} MB`,
          sizeBytes: stats.size,
          type: 'manual',
        }, null, 2)
      );

      // Rotate old backups
      await this.rotateBackups();

      return {
        success: true,
        filename: backupFilename,
        path: backupPath,
        size: `${sizeInMB} MB`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  /**
   * List all available backups
   */
  async listBackups() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(f => f.endsWith('.db'));

      const backups = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = path.join(this.backupDir, file);
          const metaPath = path.join(this.backupDir, `${file}.meta.json`);
          
          const stats = await fs.stat(filePath);
          let metadata = null;
          
          try {
            const metaContent = await fs.readFile(metaPath, 'utf-8');
            metadata = JSON.parse(metaContent);
          } catch (err) {
            // Metadata file doesn't exist
          }

          return {
            filename: file,
            size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
            sizeBytes: stats.size,
            created: metadata?.created || stats.mtime.toISOString(),
            type: metadata?.type || 'unknown',
          };
        })
      );

      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.created) - new Date(a.created));

      return backups;
    } catch (error) {
      console.error('Failed to list backups:', error);
      throw new Error(`Failed to list backups: ${error.message}`);
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(filename) {
    try {
      const backupPath = path.join(this.backupDir, filename);

      // Verify backup exists
      await fs.access(backupPath);

      // Create backup of current database before restoring
      const currentBackupName = `pre-restore-${Date.now()}.db`;
      const currentBackupPath = path.join(this.backupDir, currentBackupName);
      await fs.copyFile(this.dbPath, currentBackupPath);

      // Restore from backup
      await fs.copyFile(backupPath, this.dbPath);

      return {
        success: true,
        restoredFrom: filename,
        currentBackup: currentBackupName,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Restore failed:', error);
      throw new Error(`Failed to restore backup: ${error.message}`);
    }
  }

  /**
   * Delete old backups to maintain rotation limit
   */
  async rotateBackups() {
    try {
      const backups = await this.listBackups();

      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);

        for (const backup of toDelete) {
          const backupPath = path.join(this.backupDir, backup.filename);
          const metaPath = path.join(this.backupDir, `${backup.filename}.meta.json`);

          await fs.unlink(backupPath);
          
          // Try to delete metadata file (may not exist)
          try {
            await fs.unlink(metaPath);
          } catch (err) {
            // Ignore error if metadata doesn't exist
          }

          console.log(`Rotated backup: ${backup.filename}`);
        }
      }
    } catch (error) {
      console.error('Backup rotation failed:', error);
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(filename) {
    try {
      const backupPath = path.join(this.backupDir, filename);
      const metaPath = path.join(this.backupDir, `${filename}.meta.json`);

      await fs.unlink(backupPath);
      
      try {
        await fs.unlink(metaPath);
      } catch (err) {
        // Ignore if metadata doesn't exist
      }

      return {
        success: true,
        filename,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to delete backup: ${error.message}`);
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats() {
    try {
      const backups = await this.listBackups();
      
      const totalSize = backups.reduce((sum, b) => sum + b.sizeBytes, 0);
      const oldestBackup = backups.length > 0 ? backups[backups.length - 1] : null;
      const newestBackup = backups.length > 0 ? backups[0] : null;

      return {
        totalBackups: backups.length,
        totalSize: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
        totalSizeBytes: totalSize,
        maxBackups: this.maxBackups,
        oldestBackup,
        newestBackup,
        backupDirectory: this.backupDir,
      };
    } catch (error) {
      throw new Error(`Failed to get backup stats: ${error.message}`);
    }
  }
}

module.exports = new BackupService();
