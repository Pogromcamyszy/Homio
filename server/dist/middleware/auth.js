"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET_KEY = "supersecretjwtkey";
// JWT authentication middleware
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Missing authorization header" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        req.userId = decoded.id; // attach userId from token
        next();
    }
    catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
exports.authenticateJWT = authenticateJWT;
//# sourceMappingURL=auth.js.map