import express, { Request, Response } from "express";
import db from "../db";
import { upload } from "../middleware/upload";

const router = express.Router();

const VALID_DISTRICTS: Record<string, { min_lat: number; max_lat: number; min_lng: number; max_lng: number }> = {
  "Stare Miasto":              { min_lat: 50.055, max_lat: 50.070, min_lng: 19.930, max_lng: 19.950 },
  "Grzegórzki":               { min_lat: 50.045, max_lat: 50.065, min_lng: 19.950, max_lng: 19.980 },
  "Prądnik Czerwony":         { min_lat: 50.070, max_lat: 50.100, min_lng: 19.960, max_lng: 20.020 },
  "Prądnik Biały":            { min_lat: 50.080, max_lat: 50.120, min_lng: 19.900, max_lng: 19.960 },
  "Krowodrza":                { min_lat: 50.060, max_lat: 50.090, min_lng: 19.900, max_lng: 19.940 },
  "Bronowice":                { min_lat: 50.070, max_lat: 50.100, min_lng: 19.860, max_lng: 19.920 },
  "Zwierzyniec":              { min_lat: 50.040, max_lat: 50.090, min_lng: 19.860, max_lng: 19.920 },
  "Dębniki":                  { min_lat: 50.010, max_lat: 50.050, min_lng: 19.880, max_lng: 19.940 },
  "Łagiewniki-Borek Fałęcki": { min_lat: 49.980, max_lat: 50.020, min_lng: 19.900, max_lng: 19.960 },
  "Swoszowice":               { min_lat: 49.950, max_lat: 50.000, min_lng: 19.880, max_lng: 19.980 },
  "Podgórze Duchackie":       { min_lat: 49.980, max_lat: 50.030, min_lng: 19.960, max_lng: 20.030 },
  "Bieżanów-Prokocim":        { min_lat: 49.970, max_lat: 50.020, min_lng: 20.000, max_lng: 20.080 },
  "Podgórze":                 { min_lat: 50.020, max_lat: 50.060, min_lng: 19.950, max_lng: 20.020 },
  "Czyżyny":                  { min_lat: 50.060, max_lat: 50.090, min_lng: 20.020, max_lng: 20.080 },
  "Mistrzejowice":            { min_lat: 50.090, max_lat: 50.120, min_lng: 20.020, max_lng: 20.080 },
  "Bieńczyce":                { min_lat: 50.070, max_lat: 50.100, min_lng: 20.060, max_lng: 20.120 },
  "Wzgórza Krzesławickie":    { min_lat: 50.090, max_lat: 50.130, min_lng: 20.080, max_lng: 20.150 },
  "Nowa Huta":                { min_lat: 50.060, max_lat: 50.130, min_lng: 20.080, max_lng: 20.200 },
};

router.post(
  "/",
  upload.array("photos", 5),
  (req: Request, res: Response) => {
    const { title, district, price, type, lat, lng } = req.body;

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    // Sprawdzenie 1: czy nazwa dzielnicy istnieje na liście
    const bounds = VALID_DISTRICTS[district];
    if (!bounds) {
      res.status(400).json({ message: `Nieznana dzielnica: "${district}".` });
      return;
    }

    // Sprawdzenie 2: czy współrzędne leżą w tej dzielnicy
    const coordsMatch =
      latNum >= bounds.min_lat && latNum <= bounds.max_lat &&
      lngNum >= bounds.min_lng && lngNum <= bounds.max_lng;

    if (!coordsMatch) {
      res.status(400).json({
        message: `Współrzędne nie należą do dzielnicy "${district}".`,
      });
      return;
    }

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
      latNum,
      lngNum
    );

    res.json({ id: info.lastInsertRowid, title, district, lat: latNum, lng: lngNum });
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
        main_photo: main_photo ? `/server_pictures/listings/${main_photo}` : null,
      };
    });

    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch listings" });
  }
});

router.get("/:id", (req: Request, res: Response) => {
  try {
    const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id) as any;
    if (!row) {
      res.status(404).json({ message: "Nie znaleziono ogłoszenia." });
      return;
    }
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

export default router;