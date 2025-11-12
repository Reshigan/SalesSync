const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || '/var/backups/salessync';
    this.dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/salessync.db');
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
  }

  async createBackup() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `salessync-backup-${timestamp}.db`;
      const backupPath = path.join(this.backupDir, backupFileName);

      await execAsync(`sqlite3 ${this.dbPath} ".backup '${backupPath}'"`);

      await execAsync(`gzip ${backupPath}`);
      const gzipPath = `${backupPath}.gz`;

      const stats = await fs.stat(gzipPath);

      console.log(`✅ Backup created: ${gzipPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

      await this.cleanOldBackups();

      return {
        success: true,
        backupPath: gzipPath,
        size: stats.size,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Backup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cleanOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(f => f.startsWith('salessync-backup-') && f.endsWith('.gz'));

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`🗑️ Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      console.error('⚠️ Error cleaning old backups:', error);
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(f => f.startsWith('salessync-backup-') && f.endsWith('.gz'));

      const backups = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.mtime
          };
        })
      );

      return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  async restoreBackup(backupPath) {
    try {
      if (!backupPath.endsWith('.gz')) {
        throw new Error('Backup file must be gzipped (.gz)');
      }

      const unzippedPath = backupPath.replace('.gz', '');
      await execAsync(`gunzip -c ${backupPath} > ${unzippedPath}`);

      const backupDbPath = `${this.dbPath}.backup-${Date.now()}`;
      await fs.copyFile(this.dbPath, backupDbPath);

      await fs.copyFile(unzippedPath, this.dbPath);

      await fs.unlink(unzippedPath);

      console.log(`✅ Database restored from: ${backupPath}`);
      console.log(`📦 Previous database backed up to: ${backupDbPath}`);

      return {
        success: true,
        restoredFrom: backupPath,
        previousBackup: backupDbPath
      };
    } catch (error) {
      console.error('❌ Restore failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new BackupService();
