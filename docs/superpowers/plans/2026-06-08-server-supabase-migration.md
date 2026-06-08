# server.js Orders → Supabase Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar las rutas de órdenes en `server.js` (que usan `fs.readFileSync/writeFileSync` sobre `backend/orders.json`) por llamadas a Supabase, igual que ya hace `api/orders.js` en producción.

**Architecture:** `server.js` es el servidor Express usado en desarrollo local. Ya tiene las rutas de shipping y correo correctas; solo las tres rutas de órdenes (`POST/GET/PUT /api/orders`) usan archivos JSON. Se migran a Supabase usando el cliente ya disponible en el proyecto. Se elimina la dependencia de `fs` para órdenes. El dev workflow (`npm run build && npm start`) sigue funcionando igual.

**Tech Stack:** Express 5, `@supabase/supabase-js`, `jsonwebtoken`, `resend`. Variables en `.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`.

---

## Archivos que se tocan

| Archivo | Cambio |
|---|---|
| `server.js` | Agregar Supabase + JWT, reemplazar 3 rutas de órdenes, eliminar fs para órdenes, enriquecer sendStatusEmail |

---

## Task 1: Migrar las rutas de órdenes a Supabase

**Archivos:**
- Modificar: `server.js`

### Contexto del estado actual

`server.js` líneas 1-26 (imports y setup actual):
```js
import fs from "fs";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
// ... cors setup ...
const resend = new Resend(process.env.RESEND_KEY);
const ordersFile = "./backend/orders.json";
if (!fs.existsSync(ordersFile)) fs.writeFileSync(ordersFile, "[]");
```

Rutas de órdenes actuales (~líneas 189-243): POST, GET, PUT usan `fs.readFileSync/writeFileSync`.

### Pasos

- [ ] **Step 1: Actualizar imports y setup (reemplazar fs por Supabase + JWT)**

Leer `server.js` completo primero. Luego reemplazar el bloque de imports y setup inicial.

**Eliminar:**
```js
import fs from "fs";
```
(Solo `fs` — los demás imports se mantienen)

**Agregar después de `import { Resend } from "resend";`:**
```js
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
```

**Eliminar estas líneas** (después del setup de CORS):
```js
const ordersFile = "./backend/orders.json";
if (!fs.existsSync(ordersFile)) fs.writeFileSync(ordersFile, "[]");
```

**Agregar después de `const resend = new Resend(process.env.RESEND_KEY);`:**
```js
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
```

- [ ] **Step 2: Reemplazar `sendStatusEmail` con la versión completa**

La versión actual en `server.js` solo maneja `pagado`, `enviado`, `entregado`.
Reemplazar la función completa con esta versión que también maneja `pendiente`:

```js
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
```

- [ ] **Step 3: Reemplazar la ruta POST /api/orders**

Reemplazar el bloque actual (~líneas 189-200):
```js
// ANTES (eliminar):
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
```

Por:
```js
// DESPUÉS:
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
```

- [ ] **Step 4: Reemplazar la ruta GET /api/orders**

Reemplazar:
```js
// ANTES (eliminar):
app.get("/api/orders", (req, res) => {
  const orders = JSON.parse(fs.readFileSync(ordersFile));
  res.json(orders);
});
```

Por:
```js
// DESPUÉS:
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
```

- [ ] **Step 5: Reemplazar la ruta PUT /api/orders/:id**

Reemplazar el bloque completo (~líneas 208-243):
```js
// ANTES (eliminar el bloque completo de app.put):
app.put("/api/orders/:id", (req, res) => { ... });
```

Por:
```js
// DESPUÉS:
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
```

- [ ] **Step 6: Verificar que `fs` ya no se usa en ninguna parte del archivo**

Hacer búsqueda en `server.js` de cualquier referencia a `fs.` — debe ser cero después de la migración.
Si `import fs from "fs"` sigue en el archivo, eliminarlo ahora.

- [ ] **Step 7: Verificar arranque del servidor local**

```bash
cd "C:\Users\leina\Documents\Claude\Projects\Ludo corp\Ludo Lounge"
npm start
```

Debe iniciar sin errores. Esperar el mensaje:
```
Servidor corriendo en puerto 5000
```

Si hay error de módulo no encontrado (`jsonwebtoken`, `@supabase/supabase-js`), verificar que están en `package.json` — ambos ya están listados.

- [ ] **Step 8: Commit**

```bash
git add server.js
git commit -m "refactor: migrate server.js order routes from JSON file to Supabase"
```
