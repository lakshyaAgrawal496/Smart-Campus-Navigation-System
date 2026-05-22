const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'campus.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER' CHECK(role IN ('USER','ADMIN')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      floor TEXT NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('facility','classroom','laboratory','stairs','cafeteria','parking','office','medical','library')),
      description TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS edges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
      target TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
      distance REAL NOT NULL,
      description TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS crowd_data (
      node_id TEXT PRIMARY KEY REFERENCES locations(id) ON DELETE CASCADE,
      level TEXT NOT NULL DEFAULT 'Low' CHECK(level IN ('Low','Medium','High')),
      multiplier REAL NOT NULL DEFAULT 1.0,
      last_updated TEXT DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { getDb };
