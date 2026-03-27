import React, { useState, useEffect } from "react";

export default function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Auto-login en desarrollo
    if (import.meta.env.MODE === "development") {
      const devUser = import.meta.env.VITE_ADMIN_USER;
      const devPass = import.meta.env.VITE_ADMIN_PASS;

      if (devUser && devPass) {
        onLogin(true);
        localStorage.setItem("logged", "true");
      }
    }
  }, [onLogin]);

  const handleLogin = async () => {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, password }),
    });

    if (res.ok) {
      onLogin(true);
      localStorage.setItem("logged", "true");
    } else {
      alert("Credenciales incorrectas");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Login Admin</h2>

      <input placeholder="Usuario" onChange={(e) => setUser(e.target.value)} />
      <input type="password" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)} />

      <button onClick={handleLogin}>Entrar</button>
    </div>
  );
}