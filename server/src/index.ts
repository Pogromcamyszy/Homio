import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

import authRoutes from "./routes/auth";
import listingsRoutes from "./routes/listings";

const app = express();
app.use(cors());
app.use(express.json());

// Create server_pictures folder
const uploadDir = path.join(__dirname, "server_pictures");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Serve static files
app.use("/server_pictures", express.static(uploadDir));

app.use("/api/auth", authRoutes);
app.use("/listings", listingsRoutes);

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
