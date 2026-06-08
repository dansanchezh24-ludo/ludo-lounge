// api/login.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const setCors = (req, res) => {
  const allowed = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map(o => o.trim());
  const origin = req.headers.origin;
  if (allowed.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user, pass } = req.body;
  


  if (
    user !== process.env.ADMIN_USER ||
    pass !== process.env.ADMIN_PASS
  ) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const token = jwt.sign(
    { user, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return res.status(200).json({ token });
}