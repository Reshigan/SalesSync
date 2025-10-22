/**
 * Add Mobile Login Support for Agents
 * Adds mobile_number and mobile_pin columns
 * Seeds all agents with mobile numbers and default PIN (123456)
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/salessync.db');
const db = new Database(dbPath);

console.log('=== Adding Mobile Login Support ===\n');

try {
  db.prepare('BEGIN TRANSACTION').run();

  // Check if columns already exist
  const tableInfo = db.prepare("PRAGMA table_info(agents)").all();
  const hasMobile = tableInfo.some(col => col.name === 'mobile_number');
  const hasPin = tableInfo.some(col => col.name === 'mobile_pin');

  // Add columns if they don't exist
  if (!hasMobile) {
    console.log('Adding mobile_number column to agents...');
    db.prepare('ALTER TABLE agents ADD COLUMN mobile_number TEXT').run();
  }

  if (!hasPin) {
    console.log('Adding mobile_pin column to agents...');
    db.prepare('ALTER TABLE agents ADD COLUMN mobile_pin TEXT').run();
  }

  if (!tableInfo.some(col => col.name === 'pin_last_changed')) {
    console.log('Adding pin_last_changed column to agents...');
    db.prepare('ALTER TABLE agents ADD COLUMN pin_last_changed DATETIME').run();
  }

  console.log('✓ Schema updated\n');

  // Get all agents
  const agents = db.prepare('SELECT id, name, email FROM agents').all();
  
  console.log(`Found ${agents.length} agents\n`);

  // Assign mobile numbers and default PIN
  const defaultPin = '123456';
  let updated = 0;

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    
    // Generate South African mobile number format
    const mobile = `+2782${String(i + 1).padStart(7, '0')}`; // +27821234567 format
    
    db.prepare(`
      UPDATE agents 
      SET mobile_number = ?,
          mobile_pin = ?,
          pin_last_changed = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(mobile, defaultPin, agent.id);
    
    console.log(`✓ ${agent.name}: ${mobile} (PIN: ${defaultPin})`);
    updated++;
  }

  db.prepare('COMMIT').run();

  console.log(`\n=== Mobile Login Support Added ===`);
  console.log(`✓ ${updated} agents configured`);
  console.log(`✓ Default PIN: ${defaultPin}`);
  console.log(`✓ Mobile number format: +27821234567`);

} catch (error) {
  db.prepare('ROLLBACK').run();
  console.error('Error adding mobile login support:', error);
  process.exit(1);
} finally {
  db.close();
}
