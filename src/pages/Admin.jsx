import React, { useEffect, useState } from "react";
import axios from "axios";

const ADMIN_USER = import.meta.env.VITE_ADMIN_USER;
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS;

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("todos");

  // LOGIN
  const handleLogin = () => {
    if (userInput === ADMIN_USER && passwordInput === ADMIN_PASS) {
      setAuthed(true);
      sessionStorage.setItem("admin_auth", "true");
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  };

  // Verificar si ya estaba logueado en esta sesión
  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) loadOrders();
  }, [authed]);

  const loadOrders = async () => {
    try {
      const res = await axios.get("/api/orders");
      setOrders(res.data);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      alert("Error cargando pedidos");
    }
  };

  const updateStatus = async (id, status, guide = null) => {
    try {
      await axios.put(`/api/orders?id=${id}`, { status, guide });
      alert(`Pedido actualizado a ${status}`);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Error al actualizar status");
    }
  };

  const updateGuide = async (id, guide) => {
    try {
      await axios.put(`/api/orders?id=${id}`, { guide });
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Error al guardar guía");
    }
  };

  const getNextSteps = (order) => {
    const method = order.payment_method;
    if (method === "transferencia") {
      if (order.status === "pendiente") return ["pagado"];
      if (order.status === "pagado") return ["enviado"];
      if (order.status === "enviado") return ["entregado"];
    }
    if (method === "paypal") {
      if (order.status === "pagado") return ["enviado"];
      if (order.status === "enviado") return ["entregado"];
    }
    return [];
  };

  const filteredOrders =
    filter === "todos" ? orders : orders.filter((o) => o.status === filter);

  const totalVentas = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  // PANTALLA DE LOGIN
  if (!authed) {
    return (
      <div style={styles.loginOverlay}>
        <div style={styles.loginBox}>
          <h2 style={{ marginBottom: "20px" }}>🔒 Admin</h2>
          <input
            type="text"
            placeholder="Usuario"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={styles.input}
          />
          <button onClick={handleLogin} style={styles.btn}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // PANEL ADMIN
  return (
    <div style={styles.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Panel Admin</h1>
        <button
          onClick={() => { sessionStorage.removeItem("admin_auth"); setAuthed(false); }}
          style={{ ...styles.btn, background: "#dc3545", width: "auto", padding: "8px 16px" }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* KPIs */}
      <div style={styles.kpis}>
        <div style={styles.card}>
          <h3>Total ventas</h3>
          <p>${totalVentas.toFixed(2)}</p>
        </div>
        <div style={styles.card}>
          <h3>Pedidos</h3>
          <p>{orders.length}</p>
        </div>
      </div>

      {/* FILTROS */}
      <div style={styles.filters}>
        {["todos", "pendiente", "pagado", "enviado", "entregado"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterBtn,
              background: filter === f ? "#000" : "#ccc",
              color: filter === f ? "#fff" : "#000",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* LISTA */}
      <div style={styles.list}>
        {filteredOrders.map((order) => (
          <div key={order.id} style={styles.orderCard}>
            <div style={styles.header}>
              <b>Folio:</b> {order.id}
              <span style={styles.status}>{order.status}</span>
            </div>

            <p><b>Cliente:</b> {order.name}</p>
            <p><b>Tel:</b> {order.phone}</p>
            <p><b>Email:</b> {order.email}</p>
            <p>
              <b>Dirección:</b> {order.street} {order.number}, {order.colony},{" "}
              {order.city}, {order.state}, CP {order.zip}
            </p>
            <p><b>Método:</b> {order.payment_method}</p>
            <p><b>Total:</b> ${order.total}</p>

            <div style={styles.products}>
              {order.items?.map((item, i) => (
                <div key={i}>{item.name} x {item.quantity}</div>
              ))}
            </div>

            <div style={styles.guideBox}>
              <input
                placeholder="Número de guía"
                defaultValue={order.guide || ""}
                onBlur={(e) => updateGuide(order.id, e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.actions}>
              {getNextSteps(order).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    if (s === "enviado" && !order.guide) {
                      alert("Debes agregar número de guía primero");
                      return;
                    }
                    updateStatus(order.id, s, order.guide);
                  }}
                  style={styles.btn}
                >
                  Marcar como {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  loginOverlay: {
    position: "fixed", inset: 0, background: "#000",
    display: "flex", justifyContent: "center", alignItems: "center",
  },
  loginBox: {
    background: "#fff", padding: "40px", borderRadius: "12px",
    display: "flex", flexDirection: "column", gap: "12px",
    width: "300px", textAlign: "center",
  },
  container: { padding: "20px", fontFamily: "Arial" },
  kpis: { display: "flex", gap: "20px", marginBottom: "20px" },
  card: { background: "#000", color: "#fff", padding: "20px", borderRadius: "10px", flex: 1 },
  filters: { display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" },
  filterBtn: { padding: "10px", border: "none", cursor: "pointer", borderRadius: "5px" },
  list: { display: "grid", gap: "15px" },
  orderCard: { border: "1px solid #ddd", padding: "15px", borderRadius: "10px", background: "#fff" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "10px" },
  status: { background: "#000", color: "#fff", padding: "5px 10px", borderRadius: "5px" },
  products: { marginTop: "10px", marginBottom: "10px" },
  actions: { marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" },
  btn: { width: "100%", padding: "8px 12px", border: "none", background: "#007bff", color: "#fff", borderRadius: "5px", cursor: "pointer" },
  guideBox: { marginTop: "10px" },
  input: { width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" },
};
