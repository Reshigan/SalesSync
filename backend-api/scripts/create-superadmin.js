const bcrypt = require('bcryptjs');
const path = require('path');
const Database = require('better-sqlite3');

// Create superadmin user
async function createSuperAdmin() {
  const dbPath = path.join(__dirname, '../database/salessync.db');
  const db = new Database(dbPath);
  
  try {
    console.log('🔧 Creating SuperAdmin user...');
    
    // Create SUPERADMIN tenant if it doesn't exist
    const existingTenant = db.prepare('SELECT id FROM tenants WHERE code = ?').get('SUPERADMIN');
    
    let tenantId;
    if (!existingTenant) {
      console.log('Creating SUPERADMIN tenant...');
      const tenantResult = db.prepare(`
        INSERT INTO tenants (name, code, subscription_plan, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run('SuperAdmin', 'SUPERADMIN', 'enterprise', 'active');
      tenantId = tenantResult.lastInsertRowid;
      console.log('✅ SUPERADMIN tenant created with ID:', tenantId);
    } else {
      tenantId = existingTenant.id;
      console.log('✅ SUPERADMIN tenant already exists with ID:', tenantId);
    }
    
    // Check if superadmin user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('superadmin@salessync.system');
    
    if (existingUser) {
      console.log('⚠️  SuperAdmin user already exists');
      console.log('Updating password...');
      
      const hashedPassword = await bcrypt.hash('SuperAdmin@2025!', 10);
      db.prepare(`
        UPDATE users 
        SET password = ?, role = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE email = ?
      `).run(hashedPassword, 'superadmin', 'superadmin@salessync.system');
      
      console.log('✅ SuperAdmin password updated');
    } else {
      console.log('Creating new SuperAdmin user...');
      
      const hashedPassword = await bcrypt.hash('SuperAdmin@2025!', 10);
      db.prepare(`
        INSERT INTO users (
          tenant_id, email, password, first_name, last_name, 
          role, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        tenantId,
        'superadmin@salessync.system',
        hashedPassword,
        'Super',
        'Admin',
        'superadmin',
        'active'
      );
      
      console.log('✅ SuperAdmin user created');
    }
    
    console.log('\n🎉 SuperAdmin setup complete!');
    console.log('\n📋 SuperAdmin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Tenant Code: SUPERADMIN');
    console.log('Email:       superadmin@salessync.system');
    console.log('Password:    SuperAdmin@2025!');
    console.log('Role:        superadmin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error creating SuperAdmin:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Run the script
createSuperAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
