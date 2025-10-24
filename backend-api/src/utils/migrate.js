const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../database/salessync.db');
const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

// Run all migrations
function runMigrations(callback) {
  const db = new sqlite3.Database(DB_PATH);

  // Create migrations table if not exists
  db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating migrations table:', err);
      return callback(err);
    }

    // Get applied migrations
    db.all('SELECT filename FROM migrations', [], (err, appliedMigrations) => {
      if (err) {
        console.error('Error fetching applied migrations:', err);
        return callback(err);
      }

      const appliedSet = new Set(appliedMigrations.map(m => m.filename));

      // Read migration files
      fs.readdir(MIGRATIONS_DIR, (err, files) => {
        if (err) {
          console.error('Error reading migrations directory:', err);
          return callback(err);
        }

        const sqlFiles = files
          .filter(f => f.endsWith('.sql'))
          .sort();

        // Apply pending migrations
        let pending = sqlFiles.filter(f => !appliedSet.has(f));

        if (pending.length === 0) {
          console.log('No pending migrations');
          db.close();
          return callback(null);
        }

        console.log(`Found ${pending.length} pending migration(s)`);

        function applyNext() {
          if (pending.length === 0) {
            console.log('All migrations applied successfully');
            db.close();
            return callback(null);
          }

          const filename = pending.shift();
          const filepath = path.join(MIGRATIONS_DIR, filename);

          console.log(`Applying migration: ${filename}`);

          fs.readFile(filepath, 'utf8', (err, sql) => {
            if (err) {
              console.error(`Error reading migration file ${filename}:`, err);
              db.close();
              return callback(err);
            }

            db.exec(sql, (err) => {
              if (err) {
                console.error(`Error applying migration ${filename}:`, err);
                db.close();
                return callback(err);
              }

              // Record migration as applied
              db.run(
                'INSERT INTO migrations (filename) VALUES (?)',
                [filename],
                (err) => {
                  if (err) {
                    console.error(`Error recording migration ${filename}:`, err);
                    db.close();
                    return callback(err);
                  }

                  console.log(`✓ Applied migration: ${filename}`);
                  applyNext();
                }
              );
            });
          });
        }

        applyNext();
      });
    });
  });
}

// Run if called directly
if (require.main === module) {
  console.log('Running database migrations...');
  runMigrations((err) => {
    if (err) {
      console.error('Migration failed:', err);
      process.exit(1);
    } else {
      console.log('Migration completed successfully');
      process.exit(0);
    }
  });
}

module.exports = { runMigrations };
