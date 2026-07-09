import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import db from "../db";

const SECRET_KEY = "supersecretjwtkey";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing authorization header" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    const user = db.prepare("SELECT banned FROM users WHERE id = ?").get(decoded.id) as any;
    if (user?.banned === 1) {
      return res.status(403).json({ message: "BANNED" });
    }
    req.userId = decoded.id as number;
    req.userRole = decoded.role as string;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};