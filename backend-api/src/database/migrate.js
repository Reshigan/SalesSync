#!/usr/bin/env node

/**
 * Idempotent Database Migration Runner
 * Tracks applied migrations in schema_migrations table
 * Runs migrations in lexicographic order
 */

const fs = require('fs');
const path = require('path');
const { getDatabase } = require('./init');

function initMigrationsTable(db) {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT
      );
    `;
    db.run(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getAppliedMigrations(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT filename FROM schema_migrations ORDER BY filename', (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(r => r.filename));
    });
  });
}

function recordMigration(db, filename) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO schema_migrations (filename) VALUES (?)',
      [filename],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

async function runMigration(db, migrationFile) {
  console.log(`\n========================================`);
  console.log(`Running migration: ${migrationFile}`);
  console.log(`========================================\n`);

  const migrationPath = path.join(__dirname, 'migrations', migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  await new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    for (const statement of statements) {
      if (statement.startsWith('--')) continue;

      await new Promise((resolve, reject) => {
        db.run(statement, (err) => {
          if (err) {
            if (err.message.includes('duplicate column name') ||
                err.message.includes('already exists')) {
              console.log(`⚠️  Already exists (skipping): ${err.message}`);
              resolve();
            } else {
              reject(err);
            }
          } else {
            resolve();
          }
        });
      });

      successCount++;
      console.log(`✅ Statement ${successCount} executed successfully`);
    }

    await recordMigration(db, migrationFile);

    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`\n========================================`);
    console.log(`Migration complete: ${migrationFile}`);
    console.log(`✅ Success: ${successCount} statements`);
    console.log(`========================================\n`);

    return { successCount, errorCount: 0 };
  } catch (error) {
    await new Promise((resolve) => {
      db.run('ROLLBACK', () => resolve());
    });

    console.error(`\n❌ Migration failed: ${migrationFile}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Rolling back transaction...\n`);

    throw error;
  }
}

function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Lexicographic sort

  return files;
}

async function main() {
  const db = getDatabase();

  try {
    await initMigrationsTable(db);
    console.log('✅ Migrations table initialized\n');

    const applied = await getAppliedMigrations(db);
    console.log(`📋 Applied migrations: ${applied.length}`);
    applied.forEach(m => console.log(`   - ${m}`));

    const allMigrations = getMigrationFiles();
    console.log(`\n📁 Total migration files: ${allMigrations.length}`);

    const pending = allMigrations.filter(m => !applied.includes(m));
    
    if (pending.length === 0) {
      console.log('\n✅ No pending migrations. Database is up to date!\n');
      process.exit(0);
    }

    console.log(`\n⏳ Pending migrations: ${pending.length}`);
    pending.forEach(m => console.log(`   - ${m}`));
    console.log('');

    let successCount = 0;
    for (const migration of pending) {
      try {
        await runMigration(db, migration);
        successCount++;
      } catch (error) {
        console.error(`\n❌ Migration failed: ${migration}`);
        console.error(`   Stopping migration process.\n`);
        process.exit(1);
      }
    }

    console.log(`\n✅ All migrations completed successfully!`);
    console.log(`   Applied: ${successCount} migrations\n`);
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Migration process failed:`, error);
    process.exit(1);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { runMigration, getMigrationFiles, getAppliedMigrations };
