import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
}));
app.use(express.json());

const resend = new Resend(process.env.RESEND_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const verifyAdmin = (req) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return false;
  try {
    jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
};

const mapOrder = (body) => ({
  name: body.name,
  email: body.email,
  phone: body.phone,
  street: body.street,
  number: body.number,
  colony: body.colony,
  city: body.city,
  state: body.state,
  zip: body.zip,
  items: body.items,
  total: body.total,
  status: body.status,
  payment_method: body.paymentMethod || body.payment_method,
  guide: body.guide,
});

// 📧 Función para enviar correo según estatus
const sendStatusEmail = async (order) => {
  try {
    let subject = "";
    let html = "";

    if (order.status === "pendiente") {
      subject = "Pedido recibido";
      html = `
        <h2>¡Recibimos tu pedido!</h2>
        <p>Folio: ${order.id}</p>
        <p>Total: $${order.total}</p>
        <p>Por favor realiza tu transferencia a:</p>
        <p><b>BANCO:</b> Mercado Pago W</p>
        <p><b>CLABE:</b> 722969015506648176</p>
        <p><b>BENEFICIARIO:</b> Laura Sofia Rodriguez Quintana</p>
        <p>Una vez confirmado el pago actualizaremos tu pedido.</p>
      `;
    } else if (order.status === "pagado") {
      subject = "Pago confirmado";
      html = `<h2>Pago recibido</h2><p>Folio: ${order.id}</p>`;
    } else if (order.status === "enviado") {
      subject = "Pedido enviado";
      html = `<h2>Tu pedido fue enviado</h2><p>Folio: ${order.id}</p><p>Guía: ${order.guide}</p>`;
    } else if (order.status === "entregado") {
      subject = "Pedido entregado";
      html = `<h2>Gracias por tu compra</h2><p>Folio: ${order.id}</p>`;
    } else {
      return;
    }

    await resend.emails.send({
      from: "Ludo Lounge <noreply@ludo-lounge.com>",
      to: order.email,
      cc: "ludolounge01@gmail.com",
      subject,
      html,
    });
  } catch (error) {
    console.error("Error enviando correo:", error.message);
  }
};

// 🚚 COTIZAR ENVÍO (proxy a Skydropx Pro API v2, OAuth2 client_credentials)
const ZIP_FROM = "45239"; // Zapopan, Jalisco
const SKYDROPX_OAUTH_URL = "https://pro.skydropx.com/api/v1/oauth/token";
const SKYDROPX_QUOTATIONS_URL = "https://pro.skydropx.com/api/v1/quotations";

let skydropxToken = null;
let skydropxExpiresAt = 0;

async function getSkydropxToken() {
  const now = Date.now();
  if (skydropxToken && now < skydropxExpiresAt) return skydropxToken;

  const clientId = process.env.SKYDROPX_CLIENT_ID;
  const clientSecret = process.env.SKYDROPX_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Faltan SKYDROPX_CLIENT_ID / SKYDROPX_CLIENT_SECRET");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(SKYDROPX_OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error(`OAuth HTTP ${response.status}: ${await response.text()}`);

  const data = await response.json();
  skydropxToken = data.access_token;
  skydropxExpiresAt = now + ((data.expires_in || 7200) - 60) * 1000;
  return skydropxToken;
}

async function waitSkydropxRates(quotationId, token, maxAttempts = 12) {
  for (let i = 0; i < maxAttempts; i++) {
    const r = await fetch(`${SKYDROPX_QUOTATIONS_URL}/${quotationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(`Quotation GET HTTP ${r.status}`);
    const d = await r.json();
    const raw = d.data?.attributes?.rates || d.data?.rates || d.rates || [];
    const ready = raw.filter(
      (x) => x.success !== false && (x.total != null || x.amount_local != null || x.total_pricing != null)
    );
    if (ready.length > 0) return ready;
    await new Promise((res) => setTimeout(res, 800));
  }
  throw new Error("Cotización expiró antes de devolver tarifas");
}

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

  if (!process.env.SKYDROPX_CLIENT_ID || !process.env.SKYDROPX_CLIENT_SECRET) {
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
    const token = await getSkydropxToken();

    const createRes = await fetch(SKYDROPX_QUOTATIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quotation: {
          address_from: { country_code: "mx", postal_code: ZIP_FROM },
          address_to:   { country_code: "mx", postal_code: zip_to  },
          parcels: [{ weight: totalWeight, length: maxLength, width: maxWidth, height: maxHeight }],
        },
      }),
    });
    if (!createRes.ok) throw new Error(`POST quotation HTTP ${createRes.status}: ${await createRes.text()}`);

    const createData = await createRes.json();
    const quotationId = createData.data?.id || createData.id || createData.quotation?.id;
    if (!quotationId) throw new Error(`Respuesta sin ID: ${JSON.stringify(createData).slice(0,200)}`);

    const rawRates = await waitSkydropxRates(quotationId, token);
    const rates = rawRates
      .map((r) => ({
        id:      r.id,
        carrier: r.provider_name || r.carrier_name || r.provider || "Paquetería",
        service: r.provider_service_name || r.service_level_name || r.service_name || "Estándar",
        price:   parseFloat(r.total ?? r.amount_local ?? r.total_pricing),
        days:    r.days ?? r.estimated_days ?? "?",
      }))
      .filter((r) => !isNaN(r.price) && r.price > 0)
      .sort((a, b) => a.price - b.price);

    if (rates.length === 0) throw new Error("Skydropx no devolvió tarifas válidas");
    res.json({ rates });
  } catch (err) {
    console.error("Skydropx error:", err.message);
    res.json({
      rates: [
        { id: "fb1", carrier: "Estafeta", service: "Terrestre", price: 130, days: 5 },
        { id: "fb2", carrier: "FedEx",    service: "Ground",     price: 160, days: 3 },
      ],
      warning: "Cotización aproximada — error al conectar con Skydropx",
    });
  }
});

// 📦 CREAR PEDIDO
app.post("/api/orders", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .insert([mapOrder(req.body)])
      .select()
      .single();
    if (error) throw error;
    await sendStatusEmail(data);
    res.status(201).json({ success: true, orderId: data.id });
  } catch (error) {
    console.error("Error al guardar pedido:", error);
    res.status(500).json({ error: "Error al guardar pedido" });
  }
});

// 📦 LISTAR PEDIDOS
app.get("/api/orders", async (req, res) => {
  if (!verifyAdmin(req)) return res.status(401).json({ error: "No autorizado" });
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// 📦 ACTUALIZAR PEDIDO
app.put("/api/orders/:id", async (req, res) => {
  if (!verifyAdmin(req)) return res.status(401).json({ error: "No autorizado" });
  try {
    const id = req.params.id;
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError || !order) return res.status(404).json({ error: "Pedido no encontrado" });

    const nextStatus = req.body.status || order.status;
    const transferenciaFlow = ["pendiente", "pagado", "enviado", "entregado"];
    const paypalFlow = ["pagado", "enviado", "entregado"];

    if (
      (order.payment_method === "transferencia" &&
        transferenciaFlow.indexOf(nextStatus) < transferenciaFlow.indexOf(order.status)) ||
      (order.payment_method === "paypal" &&
        paypalFlow.indexOf(nextStatus) < paypalFlow.indexOf(order.status))
    ) {
      return res.status(400).json({ error: "Flujo inválido" });
    }

    if (nextStatus === "enviado" && !req.body.guide && !order.guide) {
      return res.status(400).json({ error: "Número de guía requerido" });
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({ ...mapOrder(req.body), status: nextStatus })
      .eq("id", id)
      .select()
      .single();
    if (updateError) throw updateError;

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
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
