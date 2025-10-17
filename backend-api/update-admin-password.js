const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

async function updateAdminPassword() {
  const dbPath = path.join(__dirname, 'database/salessync.db');
  const db = new sqlite3.Database(dbPath);
  
  try {
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword, 'admin@demo.com'],
      function(err) {
        if (err) {
          console.error('Error updating password:', err);
        } else {
          console.log('Password updated successfully for admin@demo.com');
          console.log('New hash:', hashedPassword);
        }
        db.close();
      }
    );
  } catch (error) {
    console.error('Error:', error);
    db.close();
  }
}

updateAdminPassword();