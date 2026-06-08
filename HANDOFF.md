# Handoff — Ludo Lounge
_Última actualización: 2026-06-08_

## ¿Qué es?
Tienda e-commerce de juegos de mesa. React 18 + Vite en el frontend, Express en el backend local, funciones serverless en Vercel para producción.

## URLs y accesos
| Dato | Valor |
|---|---|
| Tienda | https://www.ludo-lounge.com |
| Admin | https://www.ludo-lounge.com/soporte/acceso-mx |
| Repo | https://github.com/dansanchezh24-ludo/ludo-lounge |
| Vercel project | ludo-lounge |
| Credenciales admin | `ADMIN_USER` / `ADMIN_PASS` en `.env` |

## Stack
- **Frontend:** React 18 + Vite, React Router v7
- **Backend local:** Express 5 (`server.js`) — solo para desarrollo
- **Producción:** Vercel serverless functions (`api/login.js`, `api/orders.js`)
- **Pagos:** PayPal
- **Envíos:** Skydropx Pro v2 (OAuth2, origen Zapopan 45239)
- **Email:** Resend
- **BD:** Supabase (órdenes en producción vía `api/orders.js`)
- **Auth admin:** JWT — token en `sessionStorage`

## Cómo correr en desarrollo
```bash
# Terminal 1 — frontend
npm run dev

# Terminal 2 — backend local (envíos, correos)
npm start   # node server.js
```
Variables de entorno requeridas: `.env` (ver `.env.example` si existe, o pedir a Dan).

---

## Lo que se hizo hoy (2026-06-08)

### ✅ Seguridad — Críticos resueltos
| Commit | Descripción |
|---|---|
| `02f1c08` | Eliminado botón ⚙️ visible que abría admin sin auth |
| `f1c8171` | Fix timer cleanup + import consistente de `useRef` |
| `7eeff7f` | CORS en `server.js` restringido a whitelist por `CORS_ORIGIN` |
| `cfd9dbc` | CORS endurecido: error genérico, sin credentials, fallback localhost |
| `be63082` | CORS headers en funciones Vercel (`api/login.js`, `api/orders.js`) |
| `9e7fba7` | Acceso admin por URL directa vía React Router (ruta `/soporte/acceso-mx`) |
| `9ed6aa3` | Fix `vercel.json`: `handle: filesystem` para que assets carguen en SPA |

### Cómo entrar al admin
Ir a `https://www.ludo-lounge.com/soporte/acceso-mx` → Login con credenciales del `.env`.
No hay botón visible en la tienda. La URL no se menciona en ningún lugar de la UI.

---

## Pendientes — por prioridad

### 🟠 Alta
- [ ] **Migrar pedidos de `server.js` a Supabase completamente**
  `server.js` todavía tiene rutas `/api/orders` con `fs.readFileSync` sobre `backend/orders.json`. En producción Vercel ya usa Supabase (`api/orders.js`), pero el servidor local está desincronizado. Riesgo: si alguien corre `npm start` en producción, los pedidos se guardan en un JSON local y se pierden.
  _Acción: eliminar las rutas de órdenes de `server.js` o redirigirlas a Supabase._

- [ ] **Extraer componentes vacíos de App.jsx**
  Estos archivos tienen 0 bytes — su código vive hardcodeado en `App.jsx` (ahora ~480 líneas):
  - `src/components/Cart.jsx`
  - `src/components/ProductCard.jsx`
  - `src/components/Sidebar.jsx`
  - `src/components/WelcomeModal.jsx`
  - `src/components/OrderSummary.jsx`
  _Acción: mover cada bloque a su archivo correspondiente._

- [ ] **Verificar variable `CORS_ORIGIN` en Vercel dashboard**
  Debe estar seteada como `https://www.ludo-lounge.com` en el entorno Production.
  _Panel Vercel → Settings → Environment Variables._

### 🟡 Media
- [ ] **Desinstalar Stripe o implementarlo**
  `@stripe/react-stripe-js`, `@stripe/stripe-js` y `stripe` están instalados y suman al bundle pero no se usan en ningún componente activo.

- [ ] **README vacío**
  `README.md` tiene 0 contenido. Documentar: cómo correr en dev, qué env vars se necesitan, cómo hacer deploy.

### 🟢 Baja
- [ ] **Limpiar archivos basura en la raíz**
  Eliminar: `git` (sin extensión), `npm`, `vite`, `ludo-store@1.0.0`, `trigger.txt` — todos tienen 0 bytes o son artefactos de instalación.

- [ ] **Actualizar graphify**
  El `graphify-out/GRAPH_REPORT.md` referenciaba rutas viejas. Ya se actualizó automáticamente hoy con el hook, pero conviene verificar que los paths sean correctos.

---

## Arquitectura rápida

```
src/
├── main.jsx          ← BrowserRouter + Routes (/ y /soporte/acceso-mx)
├── App.jsx           ← Tienda completa (catálogo, carrito, checkout)
├── styles.css        ← Estilos globales
├── components/
│   ├── Header.jsx    ← Barra superior (logo, búsqueda, carrito)
│   └── LoginForm.jsx ← (legacy, no se usa activamente)
├── pages/
│   ├── Admin.jsx     ← Panel admin con login JWT propio
│   └── Checkout.jsx  ← Flujo de compra (PayPal + transferencia + Skydropx)
└── data/
    └── products.js   ← Catálogo hardcodeado (~100+ productos)

api/
├── login.js          ← POST /api/login → devuelve JWT
├── orders.js         ← GET/POST/PUT /api/orders → Supabase
└── shipping.js       ← POST /api/shipping → Skydropx proxy

server.js             ← Express local (dev únicamente)
vercel.json           ← Build + routing config para Vercel
```
