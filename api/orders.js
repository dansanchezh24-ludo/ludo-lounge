// api/orders.js
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Verificar token JWT — solo para GET y PUT (admin)
const verifyAdmin = (req) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return false;
  try {
    const token = auth.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
};

// Convierte camelCase del frontend a snake_case de Supabase
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

export default async function handler(req, res) {
  try {
    // POST — crear pedido (público, no requiere token)
    if (req.method === "POST") {
      const { data, error } = await supabase
        .from("orders")
        .insert([mapOrder(req.body)])
        .select()
        .single();
      if (error) throw error;

      await sendStatusEmail(data);
      return res.status(201).json({ success: true, orderId: data.id });
    }

    // GET y PUT — solo admin con token válido
    if (req.method === "GET" || req.method === "PUT") {
      if (!verifyAdmin(req)) {
        return res.status(401).json({ error: "No autorizado" });
      }
    }

    // GET — obtener todos los pedidos
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    // PUT — actualizar estatus
    if (req.method === "PUT") {
      const id = req.query.id;
      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError || !order)
        return res.status(404).json({ error: "Pedido no encontrado" });

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
      return res.status(200).json({ success: true, order: updatedOrder });
    }

    res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error procesando la solicitud" });
  }
}