const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'salessync.db');
const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', 'module2-inventory-enhanced.sql');

console.log('📦 Running Module 2 migration...');

const db = new sqlite3.Database(dbPath);
const migration = fs.readFileSync(migrationPath, 'utf8');

const statements = migration
  .split('\n')
  .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
  .join('\n')
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`📝 Found ${statements.length} SQL statements`);

db.serialize(() => {
  let completed = 0;
  statements.forEach((statement, index) => {
    db.run(statement, (err) => {
      if (err && !err.message.includes('already exists')) {
        console.error(`❌ Statement ${index + 1} failed:`, err.message);
      } else {
        completed++;
      }
      if (index === statements.length - 1) {
        console.log(`\n✅ Module 2 migration completed!`);
        console.log(`   Statements executed: ${completed}`);
        db.close();
      }
    });
  });
});
