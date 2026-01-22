const Database = require("better-sqlite3");

// SQLite database file
const db = new Database("homio.db");

// Create tables if not exist
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  district TEXT NOT NULL,
  price INTEGER NOT NULL,
  type TEXT NOT NULL,
  owner_id INTEGER NOT NULL,

  photo_1 TEXT,
  photo_2 TEXT,
  photo_3 TEXT,
  photo_4 TEXT,
  photo_5 TEXT,

  FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,

  -- at least one photo must be provided
  CHECK (
    photo_1 IS NOT NULL OR
    photo_2 IS NOT NULL OR
    photo_3 IS NOT NULL OR
    photo_4 IS NOT NULL OR
    photo_5 IS NOT NULL
  )
);
`);

module.exports = db;