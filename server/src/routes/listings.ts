import express, { Request, Response } from "express";
import db from "../db";
import { upload } from "../middleware/upload";

const router = express.Router();

router.post(
  "/",
  upload.array("photos", 5),
  (req: Request, res: Response) => {
    const { title, district, price, type, lat, lng } = req.body;

    const photos = req.files as Express.Multer.File[];

    const photo1 = photos[0]?.filename || null;
    const photo2 = photos[1]?.filename || null;
    const photo3 = photos[2]?.filename || null;
    const photo4 = photos[3]?.filename || null;
    const photo5 = photos[4]?.filename || null;

    const owner_id = 1; // TODO: set real user from token

    const stmt = db.prepare(`
      INSERT INTO listings
      (title, district, price, type, owner_id, photo_1, photo_2, photo_3, photo_4, photo_5, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      title,
      district,
      price,
      type,
      owner_id,
      photo1,
      photo2,
      photo3,
      photo4,
      photo5,
      lat,
      lng
    );

    res.json({ id: info.lastInsertRowid, title, district, lat, lng });
  }
);

router.get("/", (req: Request, res: Response) => {
  try {
    const rows = db.prepare("SELECT * FROM listings").all();

    const listings = rows.map((row: any) => {
      const main_photo =
        row.photo_1 ||
        row.photo_2 ||
        row.photo_3 ||
        row.photo_4 ||
        row.photo_5 ||
        null;

      return {
        id: row.id,
        title: row.title,
        district: row.district,
        price: row.price,
        type: row.type,
        owner_id: row.owner_id,
        lat: row.lat,
        lng: row.lng,
        main_photo: main_photo ? `/server_pictures/listings/${main_photo}` : null
      };
    });

    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch listings" });
  }
});

export default router;
