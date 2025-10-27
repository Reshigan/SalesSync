const Database = require('better-sqlite3');
const db = new Database('./database/salessync.db');

console.log('\n=== TENANTS ===');
const tenants = db.prepare('SELECT * FROM tenants').all();
console.log(JSON.stringify(tenants, null, 2));

if (tenants.length > 0) {
  console.log('\n=== USERS ===');
  const users = db.prepare('SELECT id, email, role, first_name, last_name FROM users LIMIT 5').all();
  console.log(JSON.stringify(users, null, 2));
}

db.close();
