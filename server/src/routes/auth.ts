// auth.ts
import express, { Request, Response } from "express";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db"); // no .js extension

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

    const existing: User | undefined = db
        .prepare("SELECT * FROM users WHERE email = ?")
        .get(email);

    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    const info = stmt.run(username, email, hashedPassword);

    res.json({ message: "User registered", id: info.lastInsertRowid });
});

// Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body as LoginBody;
    const user: User | undefined = db
        .prepare("SELECT * FROM users WHERE email = ?")
        .get(email);

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "2h" });
    res.json({ token, username: user.username });
});

module.exports = router;
