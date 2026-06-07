import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db";

const router = express.Router();
const SECRET_KEY = "supersecretjwtkey";

type User = {
  id: number;
  username: string;
  email: string;
  password: string;
};

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Wszystkie pola są wymagane." });
  }

  if (typeof username !== "string" || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Nieprawidłowy format danych." });
  }

  if (username.trim().length < 3) {
    return res.status(400).json({ message: "Nazwa użytkownika musi mieć co najmniej 3 znaki." });
  }

  if (username.trim().length > 30) {
    return res.status(400).json({ message: "Nazwa użytkownika może mieć maksymalnie 30 znaków." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Podaj poprawny adres email." });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Hasło musi mieć co najmniej 8 znaków." });
  }

  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ message: "Hasło musi zawierać co najmniej jedną wielką literę." });
  }

  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ message: "Hasło musi zawierać co najmniej jedną cyfrę." });
  }

  const existing = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as User | undefined;

  if (existing) {
    return res.status(400).json({ message: "Ten adres email jest już zajęty." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const info = db
    .prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)")
    .run(username.trim(), email, hashedPassword);

  res.json({ message: "Konto zostało utworzone.", id: info.lastInsertRowid });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Wszystkie pola są wymagane." });
  }

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Nieprawidłowy format danych." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Podaj poprawny adres email." });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as User | undefined;

  if (!user) {
    return res.status(400).json({ message: "Nieprawidłowy email lub hasło." });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(400).json({ message: "Nieprawidłowy email lub hasło." });
  }

  const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "2h" });
  res.json({ token, username: user.username });
});

export default router;