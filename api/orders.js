// api/orders.js
import fs from "fs";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_KEY);
const ordersFile = "./backend/orders.json";

// Asegurarse de que el archivo existe
if (!fs.existsSync(ordersFile)) fs.writeFileSync(ordersFile, "[]");

// Función para enviar correo según estatus
const sendStatusEmail = async (order) => {
  try {
    let subject = "";
    let html = "";

    if (order.status === "pagado") {
      subject = "Pago confirmado";
      html = `<h2>Pago recibido</h2><p>Folio: ${order.id}</p>`;
    } else if (order.status === "enviado") {
      subject = "Pedido enviado";
      html = `<h2>Tu pedido fue enviado</h2><p>Folio: ${order.id}</p><p>Guía: ${order.guide}</p>`;
    } else if (order.status === "entregado") {
      subject = "Pedido entregado";
      html = `<h2>Gracias por tu compra</h2><p>Folio: ${order.id}</p>`;
    } else {
      console.log(`No hay correo que enviar para estatus: ${order.status}`);
      return;
    }

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

// Handler principal
export default async function handler(req, res) {
  try {
    const orders = JSON.parse(fs.readFileSync(ordersFile));

    if (req.method === "POST") {
      const newOrder = { id: Date.now().toString(), ...req.body, createdAt: new Date() };
      orders.push(newOrder);
      fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
      return res.status(201).json({ success: true, orderId: newOrder.id });
    }

    if (req.method === "GET") {
      return res.status(200).json(orders);
    }

    if (req.method === "PUT") {
      const id = req.query.id;
      const index = orders.findIndex((o) => o.id === id);
      if (index === -1) return res.status(404).json({ error: "Pedido no encontrado" });

      const order = orders[index];
      const nextStatus = req.body.status || order.status;

      const transferenciaFlow = ["pendiente", "pagado", "enviado", "entregado"];
      const paypalFlow = ["pagado", "enviado", "entregado"];

      if (
        (order.paymentMethod === "transferencia" && transferenciaFlow.indexOf(nextStatus) < transferenciaFlow.indexOf(order.status)) ||
        (order.paymentMethod === "paypal" && paypalFlow.indexOf(nextStatus) < paypalFlow.indexOf(order.status))
      ) {
        return res.status(400).json({ error: "Flujo inválido" });
      }

      if (nextStatus === "enviado" && !req.body.guide && !order.guide) {
        return res.status(400).json({ error: "Número de guía requerido" });
      }

      const updatedOrder = { ...order, ...req.body, status: nextStatus };
      orders[index] = updatedOrder;
      fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

      sendStatusEmail(updatedOrder);

      return res.status(200).json({ success: true, order: updatedOrder });
    }

    res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error procesando la solicitud" });
  }
}