const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'content/db.sqlite3');
const db = new Database(dbPath);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const username = 'admin';
const password = 'password123';

const hashedPassword = bcrypt.hashSync(password, 10);

try {
  const insert = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  insert.run(username, hashedPassword);
  console.log('Admin user created successfully');
} catch (error) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    console.log('Admin user already exists');
  } else {
    console.error('Error creating admin user:', error);
  }
} finally {
  db.close();
}
