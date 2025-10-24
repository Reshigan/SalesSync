const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'salessync.db');
const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', 'module1-orders-fulfillment.sql');

console.log('📦 Running Module 1 migration...');
console.log('Database:', dbPath);
console.log('Migration:', migrationPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Database opened');
});

const migration = fs.readFileSync(migrationPath, 'utf8');

// Split by semicolons but ignore those in comments
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
  let errors = 0;

  statements.forEach((statement, index) => {
    db.run(statement, (err) => {
      if (err) {
        // Ignore "already exists" errors
        if (!err.message.includes('already exists')) {
          console.error(`❌ Statement ${index + 1} failed:`, err.message);
          errors++;
        }
      } else {
        completed++;
      }

      if (index === statements.length - 1) {
        console.log(`\n✅ Migration completed!`);
        console.log(`   Statements executed: ${completed}`);
        console.log(`   Errors (ignored): ${errors}`);
        db.close();
      }
    });
  });
});
