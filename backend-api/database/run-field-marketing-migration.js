/**
 * Field Marketing Tables Migration Script
 * Applies database schema for field marketing system
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(__dirname, 'salessync.db');

console.log(`\n========================================`);
console.log(`Field Marketing Migration`);
console.log(`Database: ${dbPath}`);
console.log(`========================================\n`);

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error(`ERROR: Database file not found at ${dbPath}`);
  process.exit(1);
}

// Open database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('✓ Connected to database\n');
});

// Read migration SQL file
const migrationPath = path.join(__dirname, 'migrations/field-marketing-tables.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split by semicolons but preserve multi-line statements
const statements = [];
let currentStatement = '';
const lines = migrationSQL.split('\n');

for (const line of lines) {
  const trimmedLine = line.trim();
  
  // Skip empty lines and comment-only lines
  if (trimmedLine.length === 0 || trimmedLine.startsWith('--')) {
    continue;
  }
  
  // Add line to current statement
  currentStatement += line + '\n';
  
  // If line ends with semicolon, we have a complete statement
  if (trimmedLine.endsWith(';')) {
    const statement = currentStatement.trim().replace(/;$/, '');
    if (statement.length > 0) {
      statements.push(statement);
    }
    currentStatement = '';
  }
}

console.log(`Found ${statements.length} SQL statements to execute\n`);

// Execute statements sequentially
let completed = 0;
let failed = 0;

function executeNext(index) {
  if (index >= statements.length) {
    console.log(`\n========================================`);
    console.log(`Migration Complete!`);
    console.log(`✓ Successful: ${completed}`);
    if (failed > 0) {
      console.log(`✗ Failed: ${failed}`);
    }
    console.log(`========================================\n`);
    
    // Close database
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        process.exit(1);
      }
      process.exit(failed > 0 ? 1 : 0);
    });
    return;
  }

  const statement = statements[index];
  
  // Show progress for major operations
  if (statement.includes('CREATE TABLE')) {
    const match = statement.match(/CREATE TABLE.*?(\w+)\s*\(/);
    if (match) {
      console.log(`Creating table: ${match[1]}...`);
    }
  } else if (statement.includes('CREATE INDEX')) {
    const match = statement.match(/CREATE.*?INDEX.*?(\w+)/);
    if (match) {
      process.stdout.write('.');
    }
  }

  db.run(statement, function(err) {
    if (err) {
      // Ignore "already exists" errors for ALTER TABLE
      if (err.message.includes('duplicate column name') || 
          err.message.includes('already exists')) {
        console.log(`  ⚠ Skipped (already exists)`);
        completed++;
      } else {
        console.error(`\n✗ Error:`, err.message);
        console.error(`  Statement:`, statement.substring(0, 100) + '...');
        failed++;
      }
    } else {
      completed++;
      if (statement.includes('CREATE TABLE') || statement.includes('CREATE VIEW')) {
        console.log(`  ✓ Success`);
      }
    }
    
    // Execute next statement
    executeNext(index + 1);
  });
}

// Start execution
console.log('Executing migration statements...\n');
executeNext(0);
