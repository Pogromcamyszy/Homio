import express from "express";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();
const SECRET_KEY = "supersecretjwtkey";

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (existing) return res.status(400).json({ message: "Email already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const stmt = db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
  const info = stmt.run(username, email, hashedPassword);

  res.json({ message: "User registered", id: info.lastInsertRowid });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "2h" });
  res.json({ token, username: user.username });
});

export default router;
