"use strict";
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
  FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
);
`);
module.exports = db;
//# sourceMappingURL=db.js.map