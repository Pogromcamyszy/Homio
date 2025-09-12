import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const SECRET_KEY = "supersecretjwtkey";

// Extend Request to include userId
export interface AuthRequest extends Request {
    userId?: number;
}

// JWT authentication middleware
export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Missing authorization header" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
        req.userId = decoded.id as number; // attach userId from token
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
