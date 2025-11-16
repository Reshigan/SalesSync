const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'salessync',
  user: process.env.DB_USER || 'salessync',
  password: process.env.DB_PASSWORD || 'salessync123',
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const migrationPath = path.join(__dirname, '../src/database/migrations/create_status_history_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running status history tables migration...');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
