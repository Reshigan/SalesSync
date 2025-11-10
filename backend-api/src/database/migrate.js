const fs = require('fs');
const path = require('path');
const { getDatabase } = require('./init');

async function runMigrations() {
  const db = getDatabase();
  const migrationsDir = path.join(__dirname, 'migrations');
  
  // Create migrations table if it doesn't exist
  await new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  // Get list of executed migrations
  const executedMigrations = await new Promise((resolve, reject) => {
    db.all('SELECT filename FROM migrations', (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(r => r.filename));
    });
  });
  
  // Get list of migration files
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`Found ${migrationFiles.length} migration files`);
  console.log(`Already executed: ${executedMigrations.length} migrations`);
  
  // Run pending migrations
  for (const file of migrationFiles) {
    if (executedMigrations.includes(file)) {
      console.log(`✓ Skipping ${file} (already executed)`);
      continue;
    }
    
    console.log(`→ Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await new Promise((resolve, reject) => {
          db.run(statement, (err) => {
            if (err) {
              console.error(`Error in ${file}:`, err.message);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
    }
    
    // Record migration as executed
    await new Promise((resolve, reject) => {
      db.run('INSERT INTO migrations (filename) VALUES (?)', [file], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log(`✓ Completed ${file}`);
  }
  
  console.log('All migrations completed successfully');
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
