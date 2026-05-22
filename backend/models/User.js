const { getDb } = require('../db/database');
const bcrypt = require('bcryptjs');

function findByUsername(username) {
  return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function createUser({ username, password, role = 'USER' }) {
  const hash = bcrypt.hashSync(password, 10);
  const db = getDb();
  db.prepare(`INSERT INTO users (username, password_hash, role) VALUES (?,?,?)`).run(username, hash, role);
  return findByUsername(username);
}

function validatePassword(user, plainText) {
  return bcrypt.compareSync(plainText, user.password_hash);
}

function getAllUsers() {
  return getDb().prepare('SELECT id, username, role, created_at FROM users').all();
}

module.exports = { findByUsername, createUser, validatePassword, getAllUsers };
