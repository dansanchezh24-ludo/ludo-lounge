// backend/orders.js
import fs from "fs";
import nodemailer from "nodemailer";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ordersFile = join(__dirname, "orders.json");

// ============================
// READ / WRITE
// ============================
export const readOrders = () => {
  if (!fs.existsSync(ordersFile)) fs.writeFileSync(ordersFile, "[]");
  const data = fs.readFileSync(ordersFile, "utf-8");
  return JSON.parse(data);
};

export const writeOrders = (orders) => {
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
};

// ============================
// MAIL CONFIG
// ============================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.VITE_ADMIN_USER,
    pass: process.env.VITE_ADMIN_PASS,
  },
});

// ============================
// EMAIL ADMIN
// ============================
export const sendOrderEmail = async (order) => {
  try {
    await transporter.sendMail({
      from: process.env.VITE_ADMIN_USER,
      to: process.env.VITE_ADMIN_USER,
      subject: `Nuevo pedido #${order.id}`,
      text: `
Nuevo pedido recibido

ID: ${order.id}
Cliente: ${order.name} (${order.email})
Total: $${order.total}
Método de pago: ${order.paymentMethod}
Productos: ${order.items.map((i) => i.name).join(", ")}
      `,
    });
  } catch (error) {
    console.error("Error enviando correo de pedido:", error);
  }
};

// ============================
// EMAIL POR ESTATUS
// ============================
export const sendStatusEmail = async (order) => {
  try {
    let subject = "";
    let message = "";

    const resumen = `
Pedido #${order.id}
Nombre: ${order.name}
Email: ${order.email}
Dirección: ${order.address || ""}

Productos:
${order.items.map(i => `- ${i.name} x${i.quantity} - $${i.price}`).join("\n")}

Total: $${order.total}
`;

    switch (order.status) {
      case "pendiente": // 🔥 compatibilidad con tu frontend
      case "pendiente_transferencia":
        subject = "Pedido recibido - Pendiente de pago";
        message = `
${resumen}

Gracias por tu pedido 🙌

Para procesarlo, realiza tu pago por transferencia:

Banco: XXXX
Cuenta: XXXX
CLABE: XXXX

Una vez realizado el pago, procederemos con el envío.
        `;
        break;

      case "pagado":
        if (order.paymentMethod === "paypal") {
          subject = "Pago confirmado ✅";
          message = `
${resumen}

Gracias por tu compra 💙

Hemos recibido tu pago correctamente.
En breve recibirás otro correo con tu número de guía y tiempo estimado de entrega.
          `;
        } else {
          subject = "Pago confirmado - Preparando envío";
          message = `
${resumen}

Tu pago ha sido confirmado ✅

Estamos preparando tu pedido.
En breve recibirás tu número de guía.
          `;
        }
        break;

      case "enviado":
        subject = "Tu pedido ha sido enviado 🚚";
        message = `
${resumen}

Tu pedido ya fue enviado 📦

Número de guía: ${order.trackingNumber}

Tiempo estimado de entrega: 2-5 días hábiles.
        `;
        break;

      case "entregado":
        subject = "Pedido entregado 🎉";
        message = `
${resumen}

Tu pedido ha sido entregado 🙌

Gracias por tu compra 💙
Esperamos verte de nuevo pronto.
        `;
        break;
    }

    await transporter.sendMail({
      from: process.env.VITE_ADMIN_USER,
      to: order.email,
      subject,
      text: message,
    });

  } catch (error) {
    console.error("Error enviando correo de estatus:", error);
  }
};

// ============================
// CREAR PEDIDO
// ============================
export const createOrder = async (orderData) => {
  const orders = readOrders();

  const newOrder = {
    id: Date.now(),
    ...orderData,
    status: orderData.paymentMethod === "paypal"
      ? "pagado"
      : "pendiente", // 🔥 se mantiene como tu frontend
    createdAt: new Date().toISOString(),
  };

  orders.push(newOrder);
  writeOrders(orders);

  await sendOrderEmail(newOrder);
  await sendStatusEmail(newOrder);

  return newOrder;
};

// ============================
// UPDATE STATUS
// ============================
export const updateOrderStatus = async (orderId, status, trackingNumber) => {
  const orders = readOrders();
  const index = orders.findIndex((o) => o.id == orderId);
  if (index === -1) return null;

  if (status) orders[index].status = status;

  // 🔥 SOPORTA guide O trackingNumber
  if (trackingNumber) {
    orders[index].trackingNumber = trackingNumber;
  }

  writeOrders(orders);

  const updatedOrder = orders[index];

  await sendStatusEmail(updatedOrder);

  return updatedOrder;
};
