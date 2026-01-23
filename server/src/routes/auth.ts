import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db";

const router = express.Router();
const SECRET_KEY = "supersecretjwtkey";

// Types
type User = {
  id: number;
  username: string;
  email: string;
  password: string;
};

type RegisterBody = {
  username: string;
  email: string;
  password: string;
};

type LoginBody = {
  email: string;
  password: string;
};

// Register
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body as RegisterBody;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const existing = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as User | undefined;

  if (existing) return res.status(400).json({ message: "Email already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const stmt = db.prepare(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
  );
  const info = stmt.run(username, email, hashedPassword);

  res.json({ message: "User registered", id: info.lastInsertRowid });
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body as LoginBody;

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as User | undefined;

  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "2h" });

  res.json({ token, username: user.username });
});

export default router;
