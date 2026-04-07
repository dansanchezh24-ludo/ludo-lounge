// api/login.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export default async function handler(req, res) {
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