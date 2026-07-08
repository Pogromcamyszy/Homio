import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import authRoutes from "./routes/auth";
import listingsRoutes from "./routes/listings";
import adminRoutes from "./routes/admin";
import profileRoutes from "./routes/profile";

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "server_pictures");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const listingsDir = path.join(__dirname, "server_pictures/listings");
if (!fs.existsSync(listingsDir)) fs.mkdirSync(listingsDir);

const avatarsDir = path.join(__dirname, "server_pictures/avatars");
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir);

app.use("/server_pictures", express.static(uploadDir));
app.use("/api/auth", authRoutes);
app.use("/listings", listingsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});