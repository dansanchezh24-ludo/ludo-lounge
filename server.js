import fs from "fs";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_KEY);
const ordersFile = "./backend/orders.json";

// Crear archivo orders.json si no existe
if (!fs.existsSync(ordersFile)) fs.writeFileSync(ordersFile, "[]");

// 📧 Función para enviar correo según estatus
const sendStatusEmail = async (order) => {
  try {
    let subject = "";
    let html = "";

    if (order.status === "pagado") {
      subject = "Pago confirmado";
      html = `<h2>Pago recibido</h2><p>Folio: ${order.id}</p>`;
    }
    if (order.status === "enviado") {
      subject = "Pedido enviado";
      html = `<h2>Tu pedido fue enviado</h2>
              <p>Folio: ${order.id}</p>
              <p>Guía: ${order.guide}</p>`;
    }
    if (order.status === "entregado") {
      subject = "Pedido entregado";
      html = `<h2>Gracias por tu compra</h2><p>Folio: ${order.id}</p>`;
    }

    if (!subject) return;

    console.log(`Enviando correo para pedido ${order.id} a ${order.email}`);
    await resend.emails.send({
      from: "Ludo Lounge <onboarding@resend.dev>",
      to: order.email,
      subject,
      html,
    });
    console.log(`Correo enviado para pedido ${order.id}`);
  } catch (error) {
    console.error("Error enviando correo:", error.message);
  }
};

// 🚚 COTIZAR ENVÍO (proxy a Skydropx)
const ZIP_FROM = "45239"; // Zapopan, Jalisco

app.post("/api/shipping", async (req, res) => {
  const { zip_to, items } = req.body;
  if (!zip_to || !/^\d{5}$/.test(zip_to))
    return res.status(400).json({ error: "Código postal inválido" });

  const totalWeight = Math.max(
    items.reduce((acc, i) => acc + (i.weight || 0.5) * i.quantity, 0), 0.1
  );
  const maxLength = Math.max(...items.map((i) => i.length || 30));
  const maxWidth  = Math.max(...items.map((i) => i.width  || 20));
  const maxHeight = Math.max(...items.map((i) => i.height || 10));

  const token = process.env.SKYDROPX_TOKEN;
  if (!token) {
    return res.json({
      rates: [
        { id: "mock1", carrier: "FedEx",    service: "FedEx Ground",         price: 150, days: 3 },
        { id: "mock2", carrier: "DHL",      service: "DHL Express",           price: 220, days: 1 },
        { id: "mock3", carrier: "Estafeta", service: "Estafeta Terrestre",    price: 120, days: 5 },
        { id: "mock4", carrier: "Redpack",  service: "Redpack Día Siguiente", price: 190, days: 2 },
      ],
      isMock: true,
    });
  }

  try {
    const response = await fetch("https://api.skydropx.com/v1/quotations", {
      method: "POST",
      headers: {
        Authorization: `Token token=${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        zip_from: ZIP_FROM,
        zip_to,
        parcel: { weight: totalWeight, height: maxHeight, width: maxWidth, length: maxLength },
      }),
    });
    const data = await response.json();
    const rates = (data.data || [])
      .map((q) => ({
        id:      q.id,
        carrier: q.attributes.carrier_name || "Paquetería",
        service: q.attributes.service_name  || "Estándar",
        price:   parseFloat(q.attributes.total_price),
        days:    q.attributes.estimated_days ?? q.attributes.days ?? "?",
      }))
      .filter((r) => !isNaN(r.price))
      .sort((a, b) => a.price - b.price);
    res.json({ rates });
  } catch (err) {
    console.error("Skydropx error:", err.message);
    res.json({
      rates: [
        { id: "fb1", carrier: "Estafeta", service: "Terrestre", price: 130, days: 5 },
        { id: "fb2", carrier: "FedEx",    service: "Ground",     price: 160, days: 3 },
      ],
      warning: "Cotización aproximada",
    });
  }
});

// 📦 CREAR PEDIDO
app.post("/api/orders", (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync(ordersFile));
    const newOrder = { id: Date.now().toString(), ...req.body, createdAt: new Date() };
    orders.push(newOrder);
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
    res.json({ success: true, orderId: newOrder.id });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar pedido" });
  }
});

// 📦 LISTAR PEDIDOS
app.get("/api/orders", (req, res) => {
  const orders = JSON.parse(fs.readFileSync(ordersFile));
  res.json(orders);
});

// 📦 ACTUALIZAR PEDIDO
app.put("/api/orders/:id", (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync(ordersFile));
    const index = orders.findIndex((o) => o.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Pedido no encontrado" });

    const order = orders[index];
    const nextStatus = req.body.status || order.status;

    // Validación de flujo
    const transferenciaFlow = ["pendiente", "pagado", "enviado", "entregado"];
    const paypalFlow = ["pagado", "enviado", "entregado"];

    if (order.paymentMethod === "transferencia" && transferenciaFlow.indexOf(nextStatus) < transferenciaFlow.indexOf(order.status)) {
      return res.status(400).json({ error: "Flujo inválido" });
    }
    if (order.paymentMethod === "paypal" && paypalFlow.indexOf(nextStatus) < paypalFlow.indexOf(order.status)) {
      return res.status(400).json({ error: "Flujo inválido" });
    }

    if (nextStatus === "enviado" && !req.body.guide && !order.guide) {
      return res.status(400).json({ error: "Número de guía requerido" });
    }

    const updatedOrder = { ...order, ...req.body, status: nextStatus };
    orders[index] = updatedOrder;
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

    sendStatusEmail(updatedOrder);
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Error actualizando pedido:", error);
    res.status(500).json({ error: "Error actualizando pedido" });
  }
});

// 🔹 Servir frontend Vite build
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "dist")));

// Cualquier ruta que no sea /api se envía a index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));