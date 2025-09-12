import express, { Request, Response } from "express";
const db = require("../db");
import { authenticateJWT } from "../middleware/auth";

const router = express.Router();

// Extend Request type for JWT-authenticated user
interface AuthRequest extends express.Request {
    userId?: number;
}

// Type for Listing input
interface ListingBody {
    title: string;
    district: string;
    price: number;
    type: string;
}

// Get all listings
router.get("/", (req: express.Request, res: express.Response) => {
    const rows = db.prepare("SELECT * FROM listings").all();
    res.json(rows);
});

// Add listing (protected)
router.post("/", authenticateJWT, (req: AuthRequest, res: express.Response) => {
    const { title, district, price, type } = req.body as ListingBody;

    if (!title || !district || !price || !type) {
        return res.status(400).json({ message: "All fields required" });
    }

    const stmt = db.prepare(
        "INSERT INTO listings (title, district, price, type, owner_id) VALUES (?, ?, ?, ?, ?)"
    );
    const info = stmt.run(title, district, price, type, req.userId!);

    const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(info.lastInsertRowid);
    res.json(listing);
});

// Update listing
router.put("/:id", authenticateJWT, (req: AuthRequest, res: express.Response) => {
    const id = parseInt(req.params.id, 10);
    const listing = db
        .prepare("SELECT * FROM listings WHERE id = ? AND owner_id = ?")
        .get(id, req.userId);

    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const { title, district, price, type } = req.body as Partial<ListingBody>;

    const stmt = db.prepare(
        "UPDATE listings SET title = ?, district = ?, price = ?, type = ? WHERE id = ?"
    );
    stmt.run(
        title ?? listing.title,
        district ?? listing.district,
        price ?? listing.price,
        type ?? listing.type,
        id
    );

    const updated = db.prepare("SELECT * FROM listings WHERE id = ?").get(id);
    res.json(updated);
});

// Delete listing
router.delete("/:id", authenticateJWT, (req: AuthRequest, res: express.Response) => {
    const id = parseInt(req.params.id, 10);
    const stmt = db.prepare("DELETE FROM listings WHERE id = ? AND owner_id = ?");
    const info = stmt.run(id, req.userId!);

    if (info.changes === 0) return res.status(404).json({ message: "Listing not found" });
    res.json({ message: "Listing deleted" });
});

module.exports = router;
