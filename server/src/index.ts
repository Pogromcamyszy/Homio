import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import db from "./db";
import authRoutes from "./routes/auth";
import listingsRoutes from "./routes/listings";
import adminRoutes from "./routes/admin";
import profileRoutes from "./routes/profile";
import favoritesRoutes from "./routes/favorites";

const SECRET_KEY = "supersecretjwtkey";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

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
app.use("/api/favorites", favoritesRoutes);

// Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Brak tokenu"));
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    socket.data.userId = decoded.id;
    socket.data.username = decoded.username;
    next();
  } catch {
    next(new Error("Nieprawidlowy token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  console.log(`Uzytkownik ${userId} polaczony`);

  // Dolacz do osobistego pokoju
  socket.join(`user:${userId}`);

  // Wyslij wiadomosc
  socket.on("send_message", ({ receiverId, content }: { receiverId: number; content: string }) => {
    if (!content?.trim()) return;

    const stmt = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    const result = stmt.run(userId, receiverId, content.trim());

    const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(result.lastInsertRowid) as any;

    // Wyslij do odbiorcy
    io.to(`user:${receiverId}`).emit("receive_message", message);
    // Wyslij potwierdzenie nadawcy
    io.to(`user:${userId}`).emit("receive_message", message);
  });

  // Pobierz historię wiadomości
  socket.on("get_messages", ({ otherUserId }: { otherUserId: number }) => {
    const messages = db.prepare(`
      SELECT * FROM messages
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
      LIMIT 100
    `).all(userId, otherUserId, otherUserId, userId);

    socket.emit("messages_history", messages);

    // Oznacz jako przeczytane
    db.prepare(`
      UPDATE messages SET read = 1
      WHERE receiver_id = ? AND sender_id = ? AND read = 0
    `).run(userId, otherUserId);
  });

  // Pobierz liste konwersacji
  socket.on("get_conversations", () => {
    const conversations = db.prepare(`
      SELECT
        u.id, u.username, u.avatar,
        m.content as last_message,
        m.created_at as last_message_at,
        (SELECT COUNT(*) FROM messages
         WHERE receiver_id = ? AND sender_id = u.id AND read = 0) as unread_count
      FROM users u
      JOIN messages m ON (
        m.id = (
          SELECT id FROM messages
          WHERE (sender_id = ? AND receiver_id = u.id)
             OR (sender_id = u.id AND receiver_id = ?)
          ORDER BY created_at DESC LIMIT 1
        )
      )
      WHERE u.id != ?
      ORDER BY m.created_at DESC
    `).all(userId, userId, userId, userId);

    socket.emit("conversations", conversations);
  });

  socket.on("disconnect", () => {
    console.log(`Uzytkownik ${userId} rozlaczony`);
  });
});

// Migracja tabeli messages
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      read INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
} catch {}

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});