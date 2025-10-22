const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');

// PostgreSQL connection
const pool = new Pool({
  user: 'salessync_user',
  host: 'localhost',
  database: 'salessync',
  password: 'salessync_password',
  port: 5432,
});

// SQLite connection
const sqliteDb = new Database(path.join(__dirname, 'database', 'salessync.db'));

// SQLite to PostgreSQL type mapping
const typeMapping = {
  'TEXT': 'TEXT',
  'INTEGER': 'INTEGER',
  'REAL': 'NUMERIC',
  'DECIMAL': 'NUMERIC',
  'DATE': 'DATE',
  'DATETIME': 'TIMESTAMP',
  'BLOB': 'BYTEA'
};

function convertSqliteTypeToPostgres(sqliteType) {
  const upperType = sqliteType.toUpperCase();
  for (const [sqlite, postgres] of Object.entries(typeMapping)) {
    if (upperType.includes(sqlite)) {
      return upperType.replace(sqlite, postgres);
    }
  }
  return sqliteType;
}

function convertSqliteSchemaToPostgres(sqliteSchema) {
  let pgSchema = sqliteSchema
    // Replace SQLite's randomblob UUID generation with PostgreSQL uuid_generate_v4()
    .replace(/DEFAULT \(lower\(hex\(randomblob\(16\)\)\)\)/g, 'DEFAULT gen_random_uuid()')
    .replace(/DEFAULT CURRENT_TIMESTAMP/g, 'DEFAULT NOW()')
    // Convert types
    .replace(/TEXT PRIMARY KEY/g, 'UUID PRIMARY KEY')
    .replace(/TEXT NOT NULL/g, 'TEXT NOT NULL')
    .replace(/TEXT,/g, 'TEXT,')
    .replace(/TEXT UNIQUE/g, 'TEXT UNIQUE')
    .replace(/DECIMAL\((\d+),(\d+)\)/g, 'NUMERIC($1,$2)')
    .replace(/DATETIME/g, 'TIMESTAMP')
    .replace(/REAL/g, 'NUMERIC');
  
  return pgSchema;
}

async function migrateSchema() {
  console.log('🔄 Starting schema migration...\n');
  
  try {
    // Enable UUID extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    console.log('✅ Enabled pgcrypto extension\n');
    
    // Get all tables from SQLite
    const tables = sqliteDb.prepare(
      "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all();
    
    console.log(`Found ${tables.length} tables to migrate\n`);
    
    for (const table of tables) {
      console.log(`Migrating table: ${table.name}`);
      
      // Drop table if exists
      await pool.query(`DROP TABLE IF EXISTS ${table.name} CASCADE;`);
      
      // Convert and create schema
      const pgSchema = convertSqliteSchemaToPostgres(table.sql);
      
      try {
        await pool.query(pgSchema);
        console.log(`  ✅ Created table ${table.name}`);
      } catch (error) {
        console.error(`  ❌ Error creating ${table.name}:`, error.message);
        console.error(`  Schema: ${pgSchema}`);
      }
    }
    
    console.log('\n✅ Schema migration complete\n');
    
  } catch (error) {
    console.error('❌ Schema migration failed:', error);
    throw error;
  }
}

async function migrateData() {
  console.log('🔄 Starting data migration...\n');
  
  try {
    // Get all tables
    const tables = sqliteDb.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all();
    
    let totalRecords = 0;
    
    for (const {name: tableName} of tables) {
      // Get column info
      const columns = sqliteDb.prepare(`PRAGMA table_info(${tableName})`).all();
      const columnNames = columns.map(col => col.name);
      
      // Get all data
      const data = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all();
      
      if (data.length === 0) {
        console.log(`  ⏭️  Skipping ${tableName} (no data)`);
        continue;
      }
      
      console.log(`  📦 Migrating ${data.length} records from ${tableName}`);
      
      // Prepare insert statement
      const placeholders = columnNames.map((_, i) => `$${i + 1}`).join(', ');
      const insertSql = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders})`;
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const row of data) {
        try {
          const values = columnNames.map(col => row[col]);
          await pool.query(insertSql, values);
          successCount++;
        } catch (error) {
          errorCount++;
          if (errorCount <= 3) {
            console.error(`    ⚠️  Error inserting into ${tableName}:`, error.message);
          }
        }
      }
      
      totalRecords += successCount;
      console.log(`  ✅ ${tableName}: ${successCount} records migrated${errorCount > 0 ? ` (${errorCount} errors)` : ''}`);
    }
    
    console.log(`\n✅ Data migration complete! Total records: ${totalRecords}\n`);
    
  } catch (error) {
    console.error('❌ Data migration failed:', error);
    throw error;
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...\n');
  
  try {
    const tables = sqliteDb.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all();
    
    for (const {name: tableName} of tables) {
      const sqliteCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      const pgResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
      const pgCount = parseInt(pgResult.rows[0].count);
      
      if (sqliteCount.count === pgCount) {
        if (pgCount > 0) {
          console.log(`  ✅ ${tableName}: ${pgCount} records`);
        }
      } else {
        console.log(`  ⚠️  ${tableName}: SQLite=${sqliteCount.count}, PostgreSQL=${pgCount}`);
      }
    }
    
    console.log('\n✅ Verification complete\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  SalesSync - SQLite to PostgreSQL Migration Tool         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  try {
    // Test connections
    console.log('Testing database connections...');
    await pool.query('SELECT NOW()');
    console.log('  ✅ PostgreSQL connected');
    sqliteDb.prepare('SELECT 1').get();
    console.log('  ✅ SQLite connected\n');
    
    // Run migration
    await migrateSchema();
    await migrateData();
    await verifyMigration();
    
    console.log('🎉 Migration completed successfully!\n');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    sqliteDb.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, migrateSchema, migrateData, verifyMigration };
