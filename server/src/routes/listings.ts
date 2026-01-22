import express, { Request } from "express";
const db = require("../db");
import { authenticateJWT } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = express.Router();

// Extend Request type for JWT-authenticated user
interface AuthRequest extends Request {
  userId?: number;
}

// Get all listings
router.get("/", (req: Request, res: express.Response) => {
  const rows = db.prepare("SELECT * FROM listings").all();
  res.json(rows);
});

// Add listing (protected + photos)
router.post(
  "/",
  authenticateJWT,
  upload.array("photos", 5),
  (req: AuthRequest, res: express.Response) => {
    const { title, district, price, type } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!title || !district || !price || !type) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "At least one photo is required" });
    }

    const paths = files.map((f) => `/server_pictures/listings/${f.filename}`);
    
    const stmt = db.prepare(
      `INSERT INTO listings 
        (title, district, price, type, owner_id, photo_1, photo_2, photo_3, photo_4, photo_5)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const info = stmt.run(
      title,
      district,
      price,
      type,
      req.userId!,
      paths[0] || null,
      paths[1] || null,
      paths[2] || null,
      paths[3] || null,
      paths[4] || null
    );

    const listing = db
      .prepare("SELECT * FROM listings WHERE id = ?")
      .get(info.lastInsertRowid);

    res.json(listing);
  }
);

// Update listing (protected + photos)
router.put(
  "/:id",
  authenticateJWT,
  upload.array("photos", 5),
  (req: AuthRequest, res: express.Response) => {
    const id = parseInt(req.params.id, 10);
    const listing = db
      .prepare("SELECT * FROM listings WHERE id = ? AND owner_id = ?")
      .get(id, req.userId);

    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const { title, district, price, type } = req.body;
    const files = req.files as Express.Multer.File[];

    let photoPaths = [
      listing.photo_1,
      listing.photo_2,
      listing.photo_3,
      listing.photo_4,
      listing.photo_5,
    ];

    if (files && files.length > 0) {
      photoPaths = files.map((f) => `/server_pictures/listings/${f.filename}`);
      while (photoPaths.length < 5) photoPaths.push(null);
    }

    if (photoPaths.every((p) => !p)) {
      return res.status(400).json({ message: "At least one photo is required" });
    }

    const stmt = db.prepare(
      `UPDATE listings SET
        title = ?,
        district = ?,
        price = ?,
        type = ?,
        photo_1 = ?,
        photo_2 = ?,
        photo_3 = ?,
        photo_4 = ?,
        photo_5 = ?
      WHERE id = ?`
    );

    stmt.run(
      title ?? listing.title,
      district ?? listing.district,
      price ?? listing.price,
      type ?? listing.type,
      photoPaths[0],
      photoPaths[1],
      photoPaths[2],
      photoPaths[3],
      photoPaths[4],
      id
    );

    const updated = db.prepare("SELECT * FROM listings WHERE id = ?").get(id);
    res.json(updated);
  }
);

// Delete listing
router.delete("/:id", authenticateJWT, (req: AuthRequest, res: express.Response) => {
  const id = parseInt(req.params.id, 10);
  const stmt = db.prepare("DELETE FROM listings WHERE id = ? AND owner_id = ?");
  const info = stmt.run(id, req.userId!);

  if (info.changes === 0) return res.status(404).json({ message: "Listing not found" });
  res.json({ message: "Listing deleted" });
});

export default router;
