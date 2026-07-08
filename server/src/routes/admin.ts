import express, { Response } from "express";
import db from "../db";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = express.Router();

router.use(authenticateJWT);
router.use(requireAdmin);

router.get("/listings/pending", (_req: AuthRequest, res: Response) => {
  try {
    const rows = db.prepare("SELECT l.*, u.username FROM listings l JOIN users u ON l.owner_id = u.id WHERE l.accepted = 0 AND l.deleted = 0").all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Blad serwera." });
  }
});

router.get("/listings", (_req: AuthRequest, res: Response) => {
  try {
    const rows = db.prepare("SELECT l.*, u.username FROM listings l JOIN users u ON l.owner_id = u.id WHERE l.deleted = 0 ORDER BY l.accepted ASC, l.id DESC").all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Blad serwera." });
  }
});

router.patch("/listings/:id/accept", (req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare("SELECT * FROM listings WHERE id = ? AND deleted = 0").get(req.params.id);
    if (!row) { res.status(404).json({ message: "Nie znaleziono ogloszenia." }); return; }
    db.prepare("UPDATE listings SET accepted = 1 WHERE id = ?").run(req.params.id);
    res.json({ message: "Ogloszenie zostalo zatwierdzone." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Blad serwera." });
  }
});

router.patch("/listings/:id/reject", (req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare("SELECT * FROM listings WHERE id = ? AND deleted = 0").get(req.params.id);
    if (!row) { res.status(404).json({ message: "Nie znaleziono ogloszenia." }); return; }
    db.prepare("UPDATE listings SET deleted = 1 WHERE id = ?").run(req.params.id);
    res.json({ message: "Ogloszenie zostalo odrzucone." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Blad serwera." });
  }
});

router.patch("/listings/:id/pending", (req: AuthRequest, res: Response) => {
  try {
    const row = db.prepare("SELECT * FROM listings WHERE id = ? AND deleted = 0").get(req.params.id);
    if (!row) { res.status(404).json({ message: "Nie znaleziono ogloszenia." }); return; }
    db.prepare("UPDATE listings SET accepted = 0 WHERE id = ?").run(req.params.id);
    res.json({ message: "Ogloszenie cofniete do oczekujacych." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Blad serwera." });
  }
});

router.get("/users", (_req: AuthRequest, res: Response) => {
  try {
    const rows = db.prepare("SELECT id, username, email, role FROM users ORDER BY id DESC").all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Blad serwera." });
  }
});

router.patch("/users/:id/role", (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (role !== "user" && role !== "admin") { res.status(400).json({ message: "Nieprawidlowa rola." }); return; }
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (!row) { res.status(404).json({ message: "Nie znaleziono uzytkownika." }); return; }
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
    res.json({ message: "Rola zostala zaktualizowana." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Blad serwera." });
  }
});

export default router;