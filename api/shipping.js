// api/shipping.js — Vercel serverless
// Cotiza envíos con Skydropx para México

const ZIP_FROM = "45239"; // Zapopan, Jalisco

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { zip_to, items } = req.body;

  if (!zip_to || !/^\d{5}$/.test(zip_to)) {
    return res.status(400).json({ error: "Código postal inválido" });
  }

  // Calcular dimensiones y peso total del paquete
  const totalWeight = Math.max(
    items.reduce((acc, item) => acc + (item.weight || 0.5) * item.quantity, 0),
    0.1
  );
  const maxLength = Math.max(...items.map((i) => i.length || 30));
  const maxWidth  = Math.max(...items.map((i) => i.width  || 20));
  const maxHeight = Math.max(...items.map((i) => i.height || 10));

  const token = process.env.SKYDROPX_TOKEN;

  // Sin API key → tarifas de prueba para desarrollo
  if (!token) {
    return res.json({
      rates: [
        { id: "mock1", carrier: "FedEx",    service: "FedEx Ground",          price: 150, days: 3 },
        { id: "mock2", carrier: "DHL",      service: "DHL Express",            price: 220, days: 1 },
        { id: "mock3", carrier: "Estafeta", service: "Estafeta Terrestre",     price: 120, days: 5 },
        { id: "mock4", carrier: "Redpack",  service: "Redpack Día Siguiente",  price: 190, days: 2 },
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
        parcel: {
          weight: totalWeight,
          height: maxHeight,
          width:  maxWidth,
          length: maxLength,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Skydropx HTTP ${response.status}`);
    }

    const data = await response.json();

    const rates = (data.data || [])
      .map((q) => ({
        id:      q.id,
        carrier: q.attributes.carrier_name || q.attributes.carrier || "Paquetería",
        service: q.attributes.service_name  || q.attributes.service || "Estándar",
        price:   parseFloat(q.attributes.total_price),
        days:    q.attributes.estimated_days ?? q.attributes.days ?? "?",
      }))
      .filter((r) => !isNaN(r.price))
      .sort((a, b) => a.price - b.price);

    return res.json({ rates });
  } catch (err) {
    console.error("Skydropx error:", err.message);
    // Fallback con tarifas aproximadas si la API falla
    return res.json({
      rates: [
        { id: "fb1", carrier: "Estafeta", service: "Terrestre",     price: 130, days: 5 },
        { id: "fb2", carrier: "FedEx",    service: "Ground",         price: 160, days: 3 },
        { id: "fb3", carrier: "DHL",      service: "Express",        price: 230, days: 1 },
      ],
      warning: "Cotización aproximada — configura SKYDROPX_TOKEN para tarifas exactas",
    });
  }
}
