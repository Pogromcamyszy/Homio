import express, { Response } from "express";
import db from "../db";
import { authenticateJWT, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.post("/:id", authenticateJWT, (req: AuthRequest, res: Response) => {
  try {
    const existing = db.prepare("SELECT * FROM favorites WHERE user_id = ? AND listing_id = ?").get(req.userId, req.params.id);
    if (existing) {
      db.prepare("DELETE FROM favorites WHERE user_id = ? AND listing_id = ?").run(req.userId, req.params.id);
      res.json({ liked: false });
    } else {
      db.prepare("INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)").run(req.userId, req.params.id);
      res.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

router.get("/", authenticateJWT, (req: AuthRequest, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT l.*, f.created_at as favorited_at,
        (SELECT COUNT(*) FROM favorites WHERE listing_id = l.id) as likes_count
      FROM favorites f
      JOIN listings l ON f.listing_id = l.id
      WHERE f.user_id = ? AND l.deleted = 0
    `).all(req.userId) as any[];

    const listings = rows.map((row) => ({
      id: row.id,
      title: row.title,
      district: row.district,
      price: row.price,
      type: row.type,
      accepted: row.accepted,
      rented: row.rented,
      favorited_at: row.favorited_at,
      likes_count: row.likes_count,
      main_photo: row.photo_1 || row.photo_2 || row.photo_3 || row.photo_4 || row.photo_5 || null,
    }));

    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

export default router;