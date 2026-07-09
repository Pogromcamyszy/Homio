import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import db from "../db";
import { upload } from "../middleware/upload";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { isPointInDistrict, findDistrictForPoint, getDistricts } from "../utils/districts";

const router = express.Router();
const SECRET_KEY = "supersecretjwtkey";
const phoneRegex = /^(\+48\s?)?[0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}$/;

router.get("/districts", (_req: Request, res: Response) => {
  try {
    const districts = getDistricts().map((d) => d.name);
    res.json(districts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

router.get("/detect-district", (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ message: "Nieprawidłowe współrzędne." });
      return;
    }
    const district = findDistrictForPoint(lat, lng);
    res.json({ district });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

router.get("/", (req: Request, res: Response) => {
  try {
    const { search, type, district, minPrice, maxPrice } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    let baseWhere = `
      FROM listings l
      JOIN users u ON l.owner_id = u.id
      WHERE l.deleted = 0 AND l.accepted = 1 AND l.rented = 0 AND u.banned = 0
    `;
    const params: any[] = [];

    if (search) {
      baseWhere += ` AND (l.title LIKE ? OR l.details LIKE ? OR l.district LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (type) { baseWhere += ` AND l.type = ?`; params.push(type); }
    if (district && district !== "All") { baseWhere += ` AND l.district = ?`; params.push(district); }
    if (minPrice) { baseWhere += ` AND l.price >= ?`; params.push(parseInt(minPrice as string)); }
    if (maxPrice) { baseWhere += ` AND l.price <= ?`; params.push(parseInt(maxPrice as string)); }

    const countQuery = `SELECT COUNT(*) as cnt ${baseWhere}`;
    const total = (db.prepare(countQuery).get(...params) as any).cnt;

    const dataQuery = `
      SELECT l.*, (SELECT COUNT(*) FROM favorites WHERE listing_id = l.id) as likes_count
      ${baseWhere}
      ORDER BY l.id DESC
      LIMIT ? OFFSET ?
    `;
    const rows = db.prepare(dataQuery).all(...params, limit, offset);

    const listings = rows.map((row: any) => {
      const main_photo = row.photo_1 || row.photo_2 || row.photo_3 || row.photo_4 || row.photo_5 || null;
      return {
        id: row.id,
        title: row.title,
        district: row.district,
        details: row.details,
        price: row.price,
        type: row.type,
        owner_id: row.owner_id,
        lat: row.lat,
        lng: row.lng,
        accepted: row.accepted,
        rented: row.rented,
        likes_count: row.likes_count,
        views: row.views,
        main_photo: main_photo ? `/server_pictures/listings/${main_photo}` : null,
      };
    });

    res.json({ listings, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch listings" });
  }
});

router.get("/my", authenticateJWT, (req: AuthRequest, res: Response) => {
  try {
    const rows = db.prepare("SELECT * FROM listings WHERE owner_id = ?").all(req.userId) as any[];
    const listings = rows.map((row) => {
      const main_photo = row.photo_1 || row.photo_2 || row.photo_3 || row.photo_4 || row.photo_5 || null;
      return {
        id: row.id,
        title: row.title,
        district: row.district,
        price: row.price,
        type: row.type,
        accepted: row.accepted,
        deleted: row.deleted,
        rented: row.rented,
        views: row.views,
        main_photo: main_photo ? `/server_pictures/listings/${main_photo}` : null,
      };
    });
    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

router.get("/:id", (req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id) as any;
    if (!row) {
      res.status(404).json({ message: "Nie znaleziono ogłoszenia." });
      return;
    }
    if (row.deleted === 1) {
      const authHeader2 = req.headers.authorization;
      let isAdmin = false;
      if (authHeader2) {
        try {
          const decoded2 = jwt.verify(authHeader2.split(" ")[1], SECRET_KEY) as any;
          isAdmin = decoded2.role === "admin";
        } catch {}
      }
      if (!isAdmin) {
        res.status(404).json({ message: "Nie znaleziono ogłoszenia." });
        return;
      }
    }

    const authHeader = req.headers.authorization;
    let isLoggedIn = false;
    let userId: number | null = null;

    if (authHeader) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], SECRET_KEY) as any;
        isLoggedIn = true;
        userId = decoded.id;
      } catch {
        isLoggedIn = false;
      }
    }

    const sessionId = req.headers["x-session-id"] as string | undefined;

    let alreadyViewed = false;
    if (userId) {
      alreadyViewed = !!db.prepare("SELECT id FROM listing_views WHERE listing_id = ? AND user_id = ?").get(req.params.id, userId);
    } else if (sessionId) {
      alreadyViewed = !!db.prepare("SELECT id FROM listing_views WHERE listing_id = ? AND session_id = ?").get(req.params.id, sessionId);
    }

    if (!alreadyViewed) {
      db.prepare("INSERT INTO listing_views (listing_id, user_id, session_id) VALUES (?, ?, ?)").run(
        req.params.id,
        userId || null,
        userId ? null : (sessionId || null)
      );
      db.prepare("UPDATE listings SET views = views + 1 WHERE id = ?").run(req.params.id);
    }

    const updatedRow = db.prepare("SELECT views FROM listings WHERE id = ?").get(req.params.id) as any;
    const owner = db.prepare("SELECT username, avatar FROM users WHERE id = ?").get(row.owner_id) as any;
    const likesCount = (db.prepare("SELECT COUNT(*) as cnt FROM favorites WHERE listing_id = ?").get(req.params.id) as any).cnt;
    const isLiked = isLoggedIn ? !!db.prepare("SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?").get(userId, req.params.id) : false;

    res.json({
      id: row.id,
      title: row.title,
      district: row.district,
      details: row.details,
      price: row.price,
      type: row.type,
      owner_id: row.owner_id,
      owner_username: owner?.username || null,
      owner_avatar: owner?.avatar || null,
      lat: row.lat,
      lng: row.lng,
      phone: isLoggedIn ? row.phone : null,
      is_owner: isLoggedIn && userId === row.owner_id,
      accepted: row.accepted,
      rented: row.rented,
      deleted: row.deleted,
      likes_count: likesCount,
      is_liked: isLiked,
      views: updatedRow.views,
      photo_1: row.photo_1,
      photo_2: row.photo_2,
      photo_3: row.photo_3,
      photo_4: row.photo_4,
      photo_5: row.photo_5,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

router.post(
  "/",
  authenticateJWT,
  upload.array("photos", 5),
  (req: AuthRequest, res: Response) => {
    const { title, district, details, price, type, phone, lat, lng } = req.body;

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (!title || !district || !price || !type) {
      res.status(400).json({ message: "Wszystkie pola są wymagane." });
      return;
    }

    if (!phone || phone.trim() === "") {
      res.status(400).json({ message: "Numer telefonu jest wymagany." });
      return;
    }

    if (!phoneRegex.test(phone.trim())) {
      res.status(400).json({ message: "Podaj poprawny polski numer telefonu (9 cyfr)." });
      return;
    }

    if (!isPointInDistrict(latNum, lngNum, district)) {
      res.status(400).json({ message: `Podana lokalizacja nie leży w dzielnicy "${district}".` });
      return;
    }

    if (details && details.length > 1000) {
      res.status(400).json({ message: "Opis może mieć maksymalnie 1000 znaków." });
      return;
    }

    const photos = req.files as Express.Multer.File[];
    const photo1 = photos[0]?.filename || null;
    const photo2 = photos[1]?.filename || null;
    const photo3 = photos[2]?.filename || null;
    const photo4 = photos[3]?.filename || null;
    const photo5 = photos[4]?.filename || null;

    const info = db.prepare(`
      INSERT INTO listings
      (title, district, details, price, type, owner_id, phone, photo_1, photo_2, photo_3, photo_4, photo_5, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, district, details || "", price, type, req.userId,
      phone.trim(), photo1, photo2, photo3, photo4, photo5, latNum, lngNum
    );

    res.json({ id: info.lastInsertRowid, title, district, lat: latNum, lng: lngNum });
  }
);

router.put("/:id", authenticateJWT, (req: AuthRequest, res: Response) => {
  try {
    const { title, district, details, price, type, phone, lat, lng } = req.body;

    const row = db.prepare("SELECT * FROM listings WHERE id = ? AND deleted = 0").get(req.params.id) as any;
    if (!row) {
      res.status(404).json({ message: "Nie znaleziono ogłoszenia." });
      return;
    }

    if (row.owner_id !== req.userId) {
      res.status(403).json({ message: "Nie masz uprawnień do edycji tego ogłoszenia." });
      return;
    }

    if (row.rented === 1) {
      res.status(400).json({ message: "Nie można edytować wynajętego ogłoszenia." });
      return;
    }

    if (!title || !district || !price || !type) {
      res.status(400).json({ message: "Wszystkie pola są wymagane." });
      return;
    }

    if (!phone || phone.trim() === "") {
      res.status(400).json({ message: "Numer telefonu jest wymagany." });
      return;
    }

    if (!phoneRegex.test(phone.trim())) {
      res.status(400).json({ message: "Podaj poprawny polski numer telefonu (9 cyfr)." });
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (!isPointInDistrict(latNum, lngNum, district)) {
      res.status(400).json({ message: `Podana lokalizacja nie leży w dzielnicy "${district}".` });
      return;
    }

    if (details && details.length > 1000) {
      res.status(400).json({ message: "Opis może mieć maksymalnie 1000 znaków." });
      return;
    }

    db.prepare(`
      UPDATE listings
      SET title = ?, district = ?, details = ?, price = ?, type = ?, phone = ?, lat = ?, lng = ?
      WHERE id = ?
    `).run(title, district, details || "", price, type, phone.trim(), latNum, lngNum, req.params.id);

    res.json({ message: "Ogłoszenie zostało zaktualizowane." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

router.delete("/:id", authenticateJWT, (req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare("SELECT * FROM listings WHERE id = ? AND deleted = 0").get(req.params.id) as any;
    if (!row) {
      res.status(404).json({ message: "Nie znaleziono ogłoszenia." });
      return;
    }

    if (row.owner_id !== req.userId) {
      res.status(403).json({ message: "Nie masz uprawnień do usunięcia tego ogłoszenia." });
      return;
    }

    db.prepare("UPDATE listings SET deleted = 1 WHERE id = ?").run(req.params.id);
    res.json({ message: "Ogłoszenie zostało usunięte." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

router.patch("/:id/restore", authenticateJWT, (req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare("SELECT * FROM listings WHERE id = ? AND deleted = 1").get(req.params.id) as any;
    if (!row) {
      res.status(404).json({ message: "Nie znaleziono usuniętego ogłoszenia." });
      return;
    }

    if (row.owner_id !== req.userId) {
      res.status(403).json({ message: "Nie masz uprawnień do przywrócenia tego ogłoszenia." });
      return;
    }

    db.prepare("UPDATE listings SET deleted = 0 WHERE id = ?").run(req.params.id);
    res.json({ message: "Ogłoszenie zostało przywrócone." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

router.patch("/:id/rent", authenticateJWT, (req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare("SELECT * FROM listings WHERE id = ? AND deleted = 0").get(req.params.id) as any;
    if (!row) { res.status(404).json({ message: "Nie znaleziono ogłoszenia." }); return; }
    if (row.owner_id !== req.userId) { res.status(403).json({ message: "Brak uprawnień." }); return; }
    db.prepare("UPDATE listings SET rented = 1 WHERE id = ?").run(req.params.id);
    res.json({ message: "Ogłoszenie oznaczone jako wynajęte." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

router.patch("/:id/unrent", authenticateJWT, (req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare("SELECT * FROM listings WHERE id = ? AND deleted = 0").get(req.params.id) as any;
    if (!row) { res.status(404).json({ message: "Nie znaleziono ogłoszenia." }); return; }
    if (row.owner_id !== req.userId) { res.status(403).json({ message: "Brak uprawnień." }); return; }
    db.prepare("UPDATE listings SET rented = 0 WHERE id = ?").run(req.params.id);
    res.json({ message: "Ogłoszenie przywrócone do aktywnych." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

export default router;