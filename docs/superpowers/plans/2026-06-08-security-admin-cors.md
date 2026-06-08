# Security: Admin Ocultamiento + CORS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ocultar el acceso al panel admin para usuarios normales y restringir CORS a orígenes conocidos en local y en Vercel.

**Architecture:** El botón ⚙️ visible se reemplaza por un activador secreto (5 clics rápidos en el logo). El CORS se cierra en `server.js` (Express local) y se agregan headers en las serverless functions de Vercel (`api/login.js`, `api/orders.js`). Todo vía variables de entorno para no hardcodear dominios.

**Tech Stack:** React 18, Express 5, Vercel Serverless Functions (Node), `cors` npm package, `jsonwebtoken`

---

## Archivos que se tocan

| Archivo | Cambio |
|---|---|
| `src/App.jsx` | Reemplazar botón ⚙️ visible por activador secreto (5 clics en logo) |
| `server.js` | Reemplazar `cors()` abierto por whitelist con `CORS_ORIGIN` |
| `api/login.js` | Agregar helper CORS + preflight OPTIONS |
| `api/orders.js` | Agregar helper CORS + preflight OPTIONS |
| `.env` | Agregar `CORS_ORIGIN` con dominio de producción |
| `.env.local` | Agregar `CORS_ORIGIN=http://localhost:5173` |

---

## Task 1: Ocultar el botón de acceso admin

**Archivos:**
- Modificar: `src/App.jsx` (líneas 75-78 y el `useEffect` de Escape)

El botón actual en `App.jsx:75-78`:
```jsx
<div style={styles.adminAccess}>
  <button onClick={() => setIsAdmin(true)}>⚙️</button>
</div>
```
Es visible para cualquier visitante. Lo eliminamos y agregamos un activador por clics rápidos en el logo del header.

- [ ] **Step 1: Agregar estado para contar clics en logo**

En `src/App.jsx`, dentro del componente `App()`, añadir después de los `useState` existentes (línea ~22):

```jsx
const logoClicksRef = React.useRef(0);
const logoClickTimerRef = React.useRef(null);

const handleLogoSecretClick = () => {
  logoClicksRef.current += 1;
  clearTimeout(logoClickTimerRef.current);
  if (logoClicksRef.current >= 5) {
    logoClicksRef.current = 0;
    setIsAdmin(true);
  } else {
    logoClickTimerRef.current = setTimeout(() => {
      logoClicksRef.current = 0;
    }, 2000);
  }
};
```

- [ ] **Step 2: Pasar el handler al Header**

Donde se renderiza `<Header>` (línea ~98), agregar la prop `onLogoClick`:

```jsx
<Header
  cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)}
  onCartClick={() => {
    setIsCartOpen(!isCartOpen);
    setShowCheckout(false);
  }}
  searchQuery={searchQuery}
  onSearchChange={(q) => {
    setSearchQuery(q);
    if (q !== "") setSelectedCategory("Todos");
  }}
  onLogoClick={handleLogoSecretClick}
/>
```

- [ ] **Step 3: Conectar el handler en Header.jsx**

Leer el archivo actual:
```
src/components/Header.jsx
```

Agregar `onLogoClick` a los props y conectarlo al elemento del logo. La firma del componente cambia de:
```jsx
export default function Header({ cartCount, onCartClick, searchQuery, onSearchChange })
```
a:
```jsx
export default function Header({ cartCount, onCartClick, searchQuery, onSearchChange, onLogoClick })
```

Donde esté el logo (imagen o texto), agregar `onClick={onLogoClick}` y `style={{ cursor: "default" }}` para que no sea obvio que es clickeable.

- [ ] **Step 4: Eliminar el botón ⚙️ visible**

En `src/App.jsx`, eliminar el bloque completo (líneas ~75-78):
```jsx
{/* ADMIN */}
<div style={styles.adminAccess}>
  <button onClick={() => setIsAdmin(true)}>⚙️</button>
</div>
```

Y eliminar el estilo correspondiente del objeto `styles` al final del archivo:
```jsx
adminAccess: { position: "fixed", bottom: 10, right: 10, zIndex: 9999 },
```

- [ ] **Step 5: Verificar manualmente**

Abrir la tienda en el browser (`npm run dev`).
- Verificar que el ⚙️ no aparece en ninguna esquina de la pantalla
- Hacer clic 5 veces rápido sobre el logo → debe abrir la pantalla de login del admin
- Hacer clic solo 2 veces (esperar 3s) → no debe abrir nada

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/components/Header.jsx
git commit -m "security: hide admin entry point behind 5-click logo secret"
```

---

## Task 2: Cerrar CORS en server.js (servidor Express local)

**Archivos:**
- Modificar: `server.js` (línea 12)
- Modificar: `.env`
- Modificar: `.env.local`

- [ ] **Step 1: Agregar CORS_ORIGIN en .env**

Abrir `.env` y agregar al final:
```
CORS_ORIGIN=https://ludo-store.vercel.app
```

> **Nota:** Reemplazar `ludo-store.vercel.app` con el dominio real de producción (o dominio personalizado si hay uno). Si tienes un dominio custom como `ludolounge.mx`, poner ese.

- [ ] **Step 2: Agregar CORS_ORIGIN en .env.local**

Abrir `.env.local` y agregar al final:
```
CORS_ORIGIN=http://localhost:5173
```

- [ ] **Step 3: Reemplazar cors() abierto en server.js**

Cambiar la línea `app.use(cors())` (línea 12) por:

```js
const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origen no permitido: ${origin}`));
  },
  credentials: true,
}));
```

- [ ] **Step 4: Verificar que el dev server sigue funcionando**

```bash
npm run dev
```

Abrir la tienda, agregar un producto al carrito, avanzar al checkout, cotizar envío. No debe aparecer ningún error de CORS en la consola del browser.

- [ ] **Step 5: Commit**

```bash
git add server.js .env .env.local
git commit -m "security: restrict CORS to known origins via env var"
```

---

## Task 3: Agregar CORS a las serverless functions de Vercel

**Archivos:**
- Modificar: `api/login.js`
- Modificar: `api/orders.js`

Las funciones serverless de Vercel no usan el middleware de Express, así que necesitan sus propios headers de CORS. En producción (mismo dominio) esto es defensivo; también habilita llamadas desde `localhost:5173` durante desarrollo.

- [ ] **Step 1: Agregar helper de CORS en api/login.js**

Al inicio del archivo, después de los imports, agregar:

```js
const setCors = (req, res) => {
  const allowed = (process.env.CORS_ORIGIN || "").split(",").map(o => o.trim());
  const origin = req.headers.origin;
  if (allowed.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};
```

Al inicio del `handler`, antes de cualquier lógica:

```js
export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") { ... }
  // ... resto igual
```

- [ ] **Step 2: Agregar helper de CORS en api/orders.js**

Al inicio del archivo, después de los imports, agregar el mismo helper:

```js
const setCors = (req, res) => {
  const allowed = (process.env.CORS_ORIGIN || "").split(",").map(o => o.trim());
  const origin = req.headers.origin;
  if (allowed.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};
```

Al inicio del `handler`:

```js
export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // POST — crear pedido ...
```

- [ ] **Step 3: Agregar CORS_ORIGIN a Vercel**

En el dashboard de Vercel (o vía CLI), agregar la variable de entorno:
```
CORS_ORIGIN = https://ludo-store.vercel.app
```

Con Vercel CLI:
```bash
vercel env add CORS_ORIGIN production
# Ingresar: https://ludo-store.vercel.app
```

- [ ] **Step 4: Commit**

```bash
git add api/login.js api/orders.js
git commit -m "security: add CORS headers to Vercel serverless functions"
```

---

## Verificación final

- [ ] Abrir la tienda en producción
- [ ] Verificar que no aparece el botón ⚙️
- [ ] Abrir DevTools → Network → hacer una compra de prueba (transferencia) → verificar que `/api/orders` responde 201 sin errores de CORS
- [ ] Hacer 5 clics rápidos en el logo → debe aparecer pantalla de login de admin
- [ ] Entrar con las credenciales correctas → debe mostrar pedidos
- [ ] En otro tab, ir a `https://evil-site.example.com` e intentar un `fetch` a `/api/orders` → debe fallar con error CORS
