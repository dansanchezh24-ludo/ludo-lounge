// api/orders.js
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
    // POST — crear nuevo pedido
    if (req.method === "POST") {
      const { data, error } = await supabase
        .from("orders")
        .insert([req.body])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, orderId: data.id });
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

    // PUT — actualizar estatus de un pedido
    if (req.method === "PUT") {
      const id = req.query.id;

      // Obtener el pedido actual
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

      // Validar flujo de estatus
      if (
        (order.payment_method === "transferencia" &&
          transferenciaFlow.indexOf(nextStatus) <
            transferenciaFlow.indexOf(order.status)) ||
        (order.payment_method === "paypal" &&
          paypalFlow.indexOf(nextStatus) < paypalFlow.indexOf(order.status))
      ) {
        return res.status(400).json({ error: "Flujo inválido" });
      }

      if (nextStatus === "enviado" && !req.body.guide && !order.guide) {
        return res.status(400).json({ error: "Número de guía requerido" });
      }

      // Actualizar en Supabase
      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({ ...req.body, status: nextStatus })
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
