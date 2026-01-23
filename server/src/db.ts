import Database from "better-sqlite3";

const db = new Database("homio.db");

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

  FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

export default db;
