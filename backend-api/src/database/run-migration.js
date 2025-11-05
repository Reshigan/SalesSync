#!/usr/bin/env node

/**
 * Database Migration Runner
 * Runs SQL migration files safely with error handling
 */

const fs = require('fs');
const path = require('path');
const { getDatabase } = require('./init');

async function runMigration(migrationFile) {
  console.log(`\n========================================`);
  console.log(`Running migration: ${migrationFile}`);
  console.log(`========================================\n`);

  const migrationPath = path.join(__dirname, 'migrations', migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  const db = getDatabase();
  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      if (statement.startsWith('--')) continue;

      await new Promise((resolve, reject) => {
        db.run(statement, (err) => {
          if (err) {
            if (err.message.includes('duplicate column name')) {
              console.log(`⚠️  Column already exists (skipping): ${err.message}`);
              resolve();
            } else if (err.message.includes('already exists')) {
              console.log(`⚠️  Object already exists (skipping): ${err.message}`);
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
    } catch (error) {
      errorCount++;
      console.error(`❌ Error executing statement ${successCount + errorCount}:`);
      console.error(`   ${error.message}`);
      console.error(`   Statement: ${statement.substring(0, 100)}...`);
      
    }
  }

  console.log(`\n========================================`);
  console.log(`Migration complete: ${migrationFile}`);
  console.log(`✅ Success: ${successCount} statements`);
  console.log(`❌ Errors: ${errorCount} statements`);
  console.log(`========================================\n`);

  return { successCount, errorCount };
}

async function main() {
  const migrationFile = process.argv[2] || '001_field_marketing_enhancements.sql';

  try {
    const result = await runMigration(migrationFile);
    
    if (result.errorCount > 0) {
      console.log(`\n⚠️  Migration completed with ${result.errorCount} errors`);
      console.log(`Please review the errors above and fix if necessary.\n`);
      process.exit(1);
    } else {
      console.log(`\n✅ Migration completed successfully!\n`);
      process.exit(0);
    }
  } catch (error) {
    console.error(`\n❌ Migration failed:`, error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runMigration };
