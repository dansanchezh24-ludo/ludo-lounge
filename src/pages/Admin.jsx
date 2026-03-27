import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("todos");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/orders");
      console.log("Pedidos cargados:", res.data);
      setOrders(res.data.reverse());
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      alert("Error cargando pedidos");
    }
  };

  const updateStatus = async (id, status, guide = null) => {
    try {
      console.log(`Actualizando estatus: ${status} para pedido ${id}, guía: ${guide}`);
      const res = await axios.put(`http://localhost:5000/api/orders/${id}`, {
        status,
        guide,
      });
      console.log("Respuesta backend:", res.data);
      alert(`Pedido ${id} actualizado a ${status}`);
      loadOrders();
    } catch (err) {
      console.error("Error actualizando status:", err.response?.data || err);
      alert(err.response?.data?.error || "Error al actualizar status");
    }
  };

  const updateGuide = async (id, guide) => {
    try {
      console.log(`Actualizando guía: ${guide} para pedido ${id}`);
      const res = await axios.put(`http://localhost:5000/api/orders/${id}`, {
        guide,
      });
      console.log("Respuesta backend:", res.data);
      alert(`Guía del pedido ${id} actualizada`);
      loadOrders();
    } catch (err) {
      console.error("Error actualizando guía:", err.response?.data || err);
      alert(err.response?.data?.error || "Error al guardar guía");
    }
  };

  // 🔥 LÓGICA DE FLUJO
  const getNextSteps = (order) => {
    if (order.paymentMethod === "transferencia") {
      if (order.status === "pendiente") return ["pagado"];
      if (order.status === "pagado") return ["enviado"];
      if (order.status === "enviado") return ["entregado"];
    }

    if (order.paymentMethod === "paypal") {
      if (order.status === "pagado") return ["enviado"];
      if (order.status === "enviado") return ["entregado"];
    }

    return [];
  };

  const filteredOrders =
    filter === "todos"
      ? orders
      : orders.filter((o) => o.status === filter);

  const totalVentas = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  return (
    <div style={styles.container}>
      <h1>Panel Admin</h1>

      {/* KPIs */}
      <div style={styles.kpis}>
        <div style={styles.card}>
          <h3>Total ventas</h3>
          <p>{totalVentas}</p>
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
            {/* HEADER */}
            <div style={styles.header}>
              <b>Folio:</b> {order.id}
              <span style={styles.status}>{order.status}</span>
            </div>

            {/* INFO CLIENTE */}
            <p><b>Cliente:</b> {order.name}</p>
            <p><b>Tel:</b> {order.phone}</p>
            <p><b>Email:</b> {order.email}</p>

            <p>
              <b>Dirección:</b>{" "}
              {order.street} {order.number}, {order.colony},{" "}
              {order.city}, {order.state}, CP {order.zip}
            </p>

            <p><b>Método:</b> {order.paymentMethod}</p>
            <p><b>Total:</b> {order.total}</p>

            {/* PRODUCTOS */}
            <div style={styles.products}>
              {order.items?.map((item, i) => (
                <div key={i}>
                  {item.name} x {item.quantity}
                </div>
              ))}
            </div>

            {/* GUÍA */}
            <div style={styles.guideBox}>
              <input
                placeholder="Número de guía"
                defaultValue={order.guide || ""}
                onBlur={(e) => updateGuide(order.id, e.target.value)}
                style={styles.input}
              />
            </div>

            {/* BOTONES INTELIGENTES */}
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
  btn: { padding: "8px 12px", border: "none", background: "#007bff", color: "#fff", borderRadius: "5px", cursor: "pointer" },
  guideBox: { marginTop: "10px" },
  input: { width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" },
};