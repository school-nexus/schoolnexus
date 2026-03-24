const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.db-data', 'school-nexus-local.db');
const db = new Database(dbPath);

console.log('--- USERS TABLE ---');
try {
    const users = db.prepare('SELECT id, username, email, role, password_hash FROM users').all();
    console.table(users);
} catch (e) {
    console.error('Error querying users:', e.message);
    // Try to list columns if it fails
    const columns = db.prepare("PRAGMA table_info('users')").all();
    console.log('Columns in users table:', columns.map(c => c.name).join(', '));
}

db.close();
