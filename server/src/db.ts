import Database from "better-sqlite3";

const db = new Database("homio.db");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  avatar TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT,
  banned INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  district TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  type TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  accepted INTEGER NOT NULL DEFAULT 0,
  rented INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  photo_1 TEXT,
  photo_2 TEXT,
  photo_3 TEXT,
  photo_4 TEXT,
  photo_5 TEXT,
  FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  polygon TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS districts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  polygon TEXT NOT NULL,
  FOREIGN KEY(city_id) REFERENCES cities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  UNIQUE(user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS listing_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  user_id INTEGER,
  session_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE
);
`);

try { db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN avatar TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN created_at TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN last_login TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN banned INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE listings ADD COLUMN rented INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE listings ADD COLUMN views INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  UNIQUE(user_id, listing_id)
)`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS listing_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  user_id INTEGER,
  session_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE
)`); } catch {}

const cityExists = db.prepare("SELECT id FROM cities WHERE name = ?").get("Kraków");

if (!cityExists) {
  const insertCity = db.prepare("INSERT INTO cities (name, lat, lng, polygon) VALUES (?, ?, ?, ?)");

  const krakowPolygon = [
    [19.7921, 49.9678], [19.8130, 49.9590], [19.8540, 49.9520],
    [19.9100, 49.9450], [19.9700, 49.9450], [20.0300, 49.9520],
    [20.0900, 49.9700], [20.1400, 49.9950], [20.1700, 50.0300],
    [20.1800, 50.0700], [20.1700, 50.1100], [20.1400, 50.1400],
    [20.0900, 50.1600], [20.0300, 50.1700], [19.9700, 50.1700],
    [19.9100, 50.1600], [19.8500, 50.1400], [19.8100, 50.1100],
    [19.7900, 50.0700], [19.7800, 50.0300], [19.7921, 49.9678]
  ];

  const city = insertCity.run("Kraków", 50.0647, 19.9450, JSON.stringify(krakowPolygon));
  const cityId = city.lastInsertRowid;

  const insertDistrict = db.prepare("INSERT INTO districts (city_id, name, polygon) VALUES (?, ?, ?)");

  const districts = [
    { name: "Stare Miasto", polygon: [[19.9200,50.0500],[19.9600,50.0500],[19.9600,50.0650],[19.9400,50.0700],[19.9200,50.0680],[19.9150,50.0600],[19.9200,50.0500]] },
    { name: "Grzegórzki", polygon: [[19.9600,50.0500],[19.9900,50.0500],[19.9950,50.0600],[19.9800,50.0700],[19.9600,50.0650],[19.9600,50.0500]] },
    { name: "Prądnik Czerwony", polygon: [[19.9400,50.0700],[19.9800,50.0700],[19.9900,50.0900],[19.9700,50.1050],[19.9400,50.1000],[19.9300,50.0850],[19.9400,50.0700]] },
    { name: "Prądnik Biały", polygon: [[19.8800,50.0900],[19.9300,50.0850],[19.9400,50.1000],[19.9300,50.1200],[19.8900,50.1200],[19.8700,50.1050],[19.8800,50.0900]] },
    { name: "Krowodrza", polygon: [[19.8800,50.0600],[19.9200,50.0600],[19.9200,50.0500],[19.9150,50.0400],[19.9000,50.0350],[19.8800,50.0400],[19.8700,50.0500],[19.8800,50.0600]] },
    { name: "Bronowice", polygon: [[19.8300,50.0600],[19.8800,50.0600],[19.8700,50.0500],[19.8600,50.0400],[19.8400,50.0400],[19.8200,50.0500],[19.8300,50.0600]] },
    { name: "Zwierzyniec", polygon: [[19.8200,50.0350],[19.8800,50.0400],[19.8600,50.0400],[19.8500,50.0300],[19.8300,50.0250],[19.8100,50.0300],[19.8200,50.0350]] },
    { name: "Dębniki", polygon: [[19.8100,50.0300],[19.8800,50.0400],[19.8800,50.0200],[19.8700,50.0050],[19.8500,49.9950],[19.8200,49.9950],[19.8000,50.0100],[19.8100,50.0300]] },
    { name: "Łagiewniki-Borek Fałęcki", polygon: [[19.8800,50.0200],[19.9200,50.0200],[19.9350,50.0100],[19.9300,49.9950],[19.9000,49.9900],[19.8700,50.0050],[19.8800,50.0200]] },
    { name: "Swoszowice", polygon: [[19.8700,49.9800],[19.9300,49.9950],[19.9500,49.9850],[19.9600,49.9700],[19.9400,49.9600],[19.9000,49.9600],[19.8700,49.9700],[19.8700,49.9800]] },
    { name: "Podgórze Duchackie", polygon: [[19.9300,49.9950],[19.9700,49.9950],[19.9900,49.9850],[19.9950,49.9700],[19.9700,49.9600],[19.9500,49.9600],[19.9300,49.9700],[19.9200,49.9850],[19.9300,49.9950]] },
    { name: "Biezanow-Prokocim", polygon: [[19.9700,49.9950],[20.0200,49.9950],[20.0400,50.0100],[20.0400,50.0300],[20.0100,50.0300],[19.9900,50.0150],[19.9700,49.9950]] },
    { name: "Podgórze", polygon: [[19.9200,50.0200],[19.9700,50.0200],[19.9900,50.0150],[19.9700,49.9950],[19.9300,49.9950],[19.9200,50.0100],[19.9200,50.0200]] },
    { name: "Czyżyny", polygon: [[19.9800,50.0700],[20.0300,50.0700],[20.0500,50.0600],[20.0500,50.0450],[20.0300,50.0350],[19.9900,50.0400],[19.9800,50.0550],[19.9800,50.0700]] },
    { name: "Mistrzejowice", polygon: [[19.9700,50.0900],[20.0200,50.0900],[20.0400,50.0800],[20.0400,50.0650],[20.0200,50.0600],[19.9800,50.0700],[19.9700,50.0800],[19.9700,50.0900]] },
    { name: "Bieńczyce", polygon: [[20.0200,50.0900],[20.0600,50.0900],[20.0700,50.0800],[20.0600,50.0700],[20.0400,50.0650],[20.0200,50.0750],[20.0200,50.0900]] },
    { name: "Wzgórza Krzeszławickie", polygon: [[20.0200,50.0300],[20.0700,50.0300],[20.0800,50.0500],[20.0700,50.0700],[20.0500,50.0700],[20.0300,50.0600],[20.0200,50.0450],[20.0200,50.0300]] },
    { name: "Nowa Huta", polygon: [[20.0300,50.0700],[20.0700,50.0700],[20.1200,50.0800],[20.1400,50.0900],[20.1400,50.1100],[20.0900,50.1200],[20.0400,50.1100],[20.0200,50.0950],[20.0200,50.0800],[20.0300,50.0700]] },
  ];

  for (const d of districts) {
    insertDistrict.run(cityId, d.name, JSON.stringify(d.polygon));
  }
}

export default db;