// api/shipping.js — Vercel serverless
// Cotiza envíos con Skydropx Pro (API v2, OAuth2 client_credentials)
// Migrado desde v1 (deprecada en abril 2026)

const ZIP_FROM = "45239"; // Zapopan, Jalisco
const OAUTH_URL = "https://pro.skydropx.com/api/v1/oauth/token";
const QUOTATIONS_URL = "https://pro.skydropx.com/api/v1/quotations";
const POSTAL_CODES_URL = "https://pro.skydropx.com/api/v1/postal_codes";

// Área fija del remitente (Zapopan, Jalisco)
const ADDRESS_FROM_AREA = {
  area_level1: "Jalisco",
  area_level2: "Zapopan",
  area_level3: "Zapopan",
};

// Cache en memoria para áreas por CP
const areaCache = new Map();

async function getAreaForZip(zip, token) {
  if (areaCache.has(zip)) return areaCache.get(zip);
  try {
    const r = await fetch(`${POSTAL_CODES_URL}?postal_code=${zip}&country_code=mx`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      const d = await r.json();
      // Skydropx devuelve un array de coincidencias; tomamos la primera
      const item =
        d?.data?.[0]?.attributes ||
        d?.data?.attributes ||
        d?.[0] ||
        d?.postal_codes?.[0] ||
        null;
      if (item) {
        const area = {
          area_level1: item.area_level1 || item.state || item.estado || "Desconocido",
          area_level2: item.area_level2 || item.municipality || item.municipio || item.city || "Desconocido",
          area_level3: item.area_level3 || item.neighborhood || item.colonia || item.suburb || "Desconocido",
        };
        areaCache.set(zip, area);
        return area;
      }
    }
  } catch (_) { /* fallback abajo */ }
  // Fallback genérico para que la cotización no falle por validación de strings vacíos
  const fallback = { area_level1: "Mexico", area_level2: "Mexico", area_level3: "Mexico" };
  areaCache.set(zip, fallback);
  return fallback;
}

// Cache de token en memoria (persiste entre invocaciones tibias de la serverless)
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) return cachedToken;

  const clientId = process.env.SKYDROPX_CLIENT_ID;
  const clientSecret = process.env.SKYDROPX_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Faltan SKYDROPX_CLIENT_ID / SKYDROPX_CLIENT_SECRET");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OAuth HTTP ${response.status}: ${text}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  const expiresIn = (data.expires_in || 7200) - 60; // refrescar 60s antes
  tokenExpiresAt = now + expiresIn * 1000;
  return cachedToken;
}

async function waitForRates(quotationId, token, maxAttempts = 12) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${QUOTATIONS_URL}/${quotationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Quotation GET HTTP ${response.status}`);
    const data = await response.json();

    // Normaliza ubicación de rates según estructura JSON:API de Skydropx
    const raw =
      data.data?.attributes?.rates ||
      data.data?.rates ||
      data.rates ||
      [];

    const ready = raw.filter(
      (r) =>
        (r.success !== false) &&
        (r.total != null || r.amount_local != null || r.total_pricing != null)
    );

    if (ready.length > 0) return ready;
    await new Promise((res) => setTimeout(res, 800));
  }
  throw new Error("Cotización expiró antes de devolver tarifas");
}

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

  // Sin credenciales → tarifas de prueba para desarrollo
  if (!process.env.SKYDROPX_CLIENT_ID || !process.env.SKYDROPX_CLIENT_SECRET) {
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
    const token = await getAccessToken();

    // Lookup de área para el CP destino (la API v2 ahora exige area_level1/2/3)
    const toArea = await getAreaForZip(zip_to, token);

    // 1) Crear la cotización
    const createRes = await fetch(QUOTATIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quotation: {
          address_from: { country_code: "mx", postal_code: ZIP_FROM, ...ADDRESS_FROM_AREA },
          address_to:   { country_code: "mx", postal_code: zip_to,   ...toArea            },
          parcels: [{
            weight: totalWeight,
            length: maxLength,
            width:  maxWidth,
            height: maxHeight,
          }],
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`POST quotation HTTP ${createRes.status}: ${errText}`);
    }

    const createData = await createRes.json();
    const quotationId =
      createData.data?.id ||
      createData.id ||
      createData.quotation?.id;

    if (!quotationId) {
      throw new Error(`Respuesta sin ID: ${JSON.stringify(createData).slice(0, 200)}`);
    }

    // 2) Esperar a que Skydropx devuelva las tarifas (la cotización es asíncrona)
    const rawRates = await waitForRates(quotationId, token);

    // 3) Normalizar a formato que espera el frontend
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

    if (rates.length === 0) {
      throw new Error("Skydropx no devolvió tarifas válidas");
    }

    return res.json({ rates });
  } catch (err) {
    console.error("Skydropx error:", err.message);
    return res.json({
      rates: [
        { id: "fb1", carrier: "Estafeta", service: "Terrestre", price: 130, days: 5 },
        { id: "fb2", carrier: "FedEx",    service: "Ground",     price: 160, days: 3 },
        { id: "fb3", carrier: "DHL",      service: "Express",    price: 230, days: 1 },
      ],
      warning: "Cotización aproximada — error al conectar con Skydropx",
    });
  }
}
