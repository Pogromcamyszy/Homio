import express, { Response } from "express";
import db from "../db";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { uploadAvatar } from "../middleware/upload";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";

const router = express.Router();

router.get("/me", authenticateJWT, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare("SELECT id, username, email, role, avatar, created_at, last_login FROM users WHERE id = ?").get(req.userId) as any;
    if (!user) { res.status(404).json({ message: "Nie znaleziono użytkownika." }); return; }

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN deleted = 0 AND accepted = 1 AND rented = 0 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN deleted = 0 AND accepted = 0 AND rented = 0 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN rented = 1 AND deleted = 0 THEN 1 ELSE 0 END) as rented,
        SUM(CASE WHEN deleted = 1 THEN 1 ELSE 0 END) as deleted
      FROM listings WHERE owner_id = ?
    `).get(req.userId) as any;

    const totalLikesReceived = (db.prepare(`
      SELECT COUNT(*) as cnt FROM favorites f
      JOIN listings l ON f.listing_id = l.id
      WHERE l.owner_id = ?
    `).get(req.userId) as any).cnt;

    const totalLikesGiven = (db.prepare("SELECT COUNT(*) as cnt FROM favorites WHERE user_id = ?").get(req.userId) as any).cnt;

    const listings = db.prepare(`
      SELECT id, title, district, price, type, photo_1, photo_2, photo_3, photo_4, photo_5
      FROM listings WHERE owner_id = ? AND deleted = 0 AND accepted = 1 AND rented = 0
    `).all(req.userId) as any[];

    const listingsWithPhoto = listings.map((l) => ({
      id: l.id,
      title: l.title,
      district: l.district,
      price: l.price,
      type: l.type,
      main_photo: l.photo_1 || l.photo_2 || l.photo_3 || l.photo_4 || l.photo_5 || null,
    }));

    res.json({ ...user, stats: { ...stats, likes_received: totalLikesReceived, likes_given: totalLikesGiven }, listings: listingsWithPhoto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

router.post("/avatar", authenticateJWT, uploadAvatar.single("avatar"), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ message: "Brak pliku." }); return; }

    const user = db.prepare("SELECT avatar FROM users WHERE id = ?").get(req.userId) as any;
    if (user?.avatar) {
      const oldPath = path.join(__dirname, "../server_pictures/avatars", user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(req.file.filename, req.userId);
    res.json({ avatar: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

router.patch("/password", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "Wszystkie pola są wymagane." });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ message: "Hasło musi mieć co najmniej 8 znaków." });
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      res.status(400).json({ message: "Hasło musi zawierać co najmniej jedną wielką literę." });
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      res.status(400).json({ message: "Hasło musi zawierać co najmniej jedną cyfrę." });
      return;
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
    if (!user) { res.status(404).json({ message: "Nie znaleziono użytkownika." }); return; }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      res.status(400).json({ message: "Aktualne hasło jest nieprawidłowe." });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, req.userId);
    res.json({ message: "Hasło zostało zmienione." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

router.get("/:id", (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare("SELECT id, username, avatar, created_at FROM users WHERE id = ?").get(req.params.id) as any;
    if (!user) { res.status(404).json({ message: "Nie znaleziono użytkownika." }); return; }

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN deleted = 0 AND accepted = 1 AND rented = 0 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN rented = 1 AND deleted = 0 THEN 1 ELSE 0 END) as rented
      FROM listings WHERE owner_id = ?
    `).get(req.params.id) as any;

    const totalLikesReceived = (db.prepare(`
      SELECT COUNT(*) as cnt FROM favorites f
      JOIN listings l ON f.listing_id = l.id
      WHERE l.owner_id = ?
    `).get(req.params.id) as any).cnt;

    const totalLikesGiven = (db.prepare("SELECT COUNT(*) as cnt FROM favorites WHERE user_id = ?").get(req.params.id) as any).cnt;

    const listings = db.prepare(`
      SELECT id, title, district, price, type, photo_1, photo_2, photo_3, photo_4, photo_5
      FROM listings WHERE owner_id = ? AND deleted = 0 AND accepted = 1 AND rented = 0
    `).all(req.params.id) as any[];

    const listingsWithPhoto = listings.map((l) => ({
      id: l.id,
      title: l.title,
      district: l.district,
      price: l.price,
      type: l.type,
      main_photo: l.photo_1 || l.photo_2 || l.photo_3 || l.photo_4 || l.photo_5 || null,
    }));

    res.json({ ...user, stats: { ...stats, likes_received: totalLikesReceived, likes_given: totalLikesGiven }, listings: listingsWithPhoto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

export default router;