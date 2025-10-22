const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/salessync.db');
const db = new Database(dbPath);

console.log('Initializing currency system...');

try {
  // Get DEMO tenant ID
  const tenant = db.prepare('SELECT id FROM tenants WHERE code = ?').get('DEMO');
  
  if (!tenant) {
    console.error('DEMO tenant not found!');
    process.exit(1);
  }

  console.log('Found DEMO tenant:', tenant.id);

  // Check if currencies table has data
  const currencyCount = db.prepare('SELECT COUNT(*) as count FROM currencies').get();
  
  if (currencyCount.count === 0) {
    console.log('Inserting currency data...');
    
    // Insert ZAR (South African Rand) as primary currency
    const zarId = 'zar-currency-001';
    db.prepare(`
      INSERT INTO currencies (id, tenant_id, code, name, symbol, decimal_places, exchange_rate, is_base_currency, is_active, created_at, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(zarId, tenant.id, 'ZAR', 'South African Rand', 'R', 2, 1.0, 1, 1);
    
    console.log('✓ Inserted ZAR currency');

    // Insert USD for reference
    db.prepare(`
      INSERT INTO currencies (id, tenant_id, code, name, symbol, decimal_places, exchange_rate, is_base_currency, is_active, created_at, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run('usd-currency-001', tenant.id, 'USD', 'US Dollar', '$', 2, 0.053, 0, 1);
    
    console.log('✓ Inserted USD currency');

    // Insert EUR for reference
    db.prepare(`
      INSERT INTO currencies (id, tenant_id, code, name, symbol, decimal_places, exchange_rate, is_base_currency, is_active, created_at, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run('eur-currency-001', tenant.id, 'EUR', 'Euro', '€', 2, 0.049, 0, 1);
    
    console.log('✓ Inserted EUR currency');

    // Set ZAR as default currency for tenant regions
    db.prepare(`
      INSERT INTO currency_regions (id, tenant_id, currency_id, country_code, is_default, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run('currency-region-zar', tenant.id, zarId, 'ZA', 1);
    
    console.log('✓ Set ZAR as default currency for South Africa');

    // Update tenant settings to include currency configuration
    const tenantSettings = {
      defaultCurrency: 'ZAR',
      currencySymbol: 'R',
      currencyPosition: 'before', // R 100.00
      decimalSeparator: '.',
      thousandsSeparator: ',',
      decimalPlaces: 2
    };

    // Check if settings column exists
    const tableInfo = db.prepare("PRAGMA table_info(tenants)").all();
    const hasSettingsColumn = tableInfo.some(col => col.name === 'settings');
    
    if (!hasSettingsColumn) {
      console.log('Adding settings column to tenants table...');
      db.prepare('ALTER TABLE tenants ADD COLUMN settings TEXT DEFAULT "{}"').run();
    }

    db.prepare(`
      UPDATE tenants 
      SET settings = ?
      WHERE id = ?
    `).run(JSON.stringify(tenantSettings), tenant.id);
    
    console.log('✓ Updated tenant currency settings');

    console.log('\n✅ Currency system initialized successfully!');
    console.log('\nDefault Currency: ZAR (R)');
    console.log('Format: R 1,234.56');
  } else {
    console.log(`✓ Currency system already initialized (${currencyCount.count} currencies found)`);
  }

} catch (error) {
  console.error('Error initializing currency system:', error);
  process.exit(1);
} finally {
  db.close();
}
