const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'salessync.db');
const db = new Database(dbPath);

async function resetAllPasswords() {
  const newPassword = 'admin123';
  
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Get all users
    const users = db.prepare('SELECT id, email, role FROM users').all();
    
    console.log(`Resetting passwords for ${users.length} users...\n`);
    
    for (const user of users) {
      // Update the user's password
      const result = db.prepare(`
        UPDATE users 
        SET password_hash = ?
        WHERE id = ?
      `).run(hashedPassword, user.id);
      
      console.log(`✓ ${user.email} (${user.role}) - Password reset to 'admin123'`);
    }
    
    console.log(`\n✅ All passwords have been reset to: admin123`);
    
  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    db.close();
  }
}

resetAllPasswords();
