# Extract Components from App.jsx Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover el JSX y estilos inline de 4 secciones de `App.jsx` a sus archivos de componentes correspondientes (que actualmente existen pero están vacíos), reduciendo `App.jsx` de ~500 líneas a ~180.

**Architecture:** Cada componente recibe solo los props que necesita — callbacks y datos mínimos. Los estilos inline se mueven con el componente al que pertenecen. `App.jsx` queda como coordinador de estado y composición, sin lógica de presentación interna. No se cambia ninguna funcionalidad ni comportamiento visual.

**Tech Stack:** React 18, JSX. Sin librerías nuevas.

---

## Mapa de extracción

| Componente | Líneas en App.jsx | Props que recibe |
|---|---|---|
| `WelcomeModal` | 71-87 | `onClose` |
| `Sidebar` | 102-114 | `categories`, `selectedCategory`, `onSelect` |
| `ProductCard` | 124-153 | `product`, `isTopSeller`, `onAddToCart`, `onClick` |
| `Cart` | 228-274 (+ overlay 229-237) | `isOpen`, `cart`, `total`, `onClose`, `onAdd`, `onRemove`, `onCheckout` |

> `OrderSummary.jsx` se deja para una iteración futura (no hay sección clara en el código actual que le corresponda).

---

## Task 1: Extraer WelcomeModal

**Archivos:**
- Crear: `src/components/WelcomeModal.jsx`
- Modificar: `src/App.jsx`

- [ ] **Step 1: Crear `src/components/WelcomeModal.jsx`**

```jsx
import React from "react";

export default function WelcomeModal({ onClose }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <img
          src="/images/bienvenida.png"
          alt="Bienvenida"
          style={styles.modalImage}
        />
        <button onClick={onClose} style={styles.modalBtn}>
          Entrar al catálogo
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    padding: "20px",
    overflowY: "auto",
  },
  modal: {
    background: "#fff",
    padding: "15px",
    borderRadius: "12px",
    textAlign: "center",
    maxWidth: "420px",
    width: "100%",
  },
  modalImage: {
    width: "100%",
    height: "auto",
    maxHeight: "75vh",
    objectFit: "contain",
    borderRadius: "10px",
  },
  modalBtn: {
    marginTop: "10px",
    padding: "14px",
    width: "100%",
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "16px",
    position: "sticky",
    bottom: "0",
  },
};
```

- [ ] **Step 2: En `App.jsx` — importar y usar WelcomeModal**

Agregar import al inicio del archivo (después de `import Header`):
```jsx
import WelcomeModal from "./components/WelcomeModal";
```

Reemplazar en el return (líneas ~71-87):
```jsx
{/* ANTES — eliminar: */}
{showWelcome && (
  <div style={styles.overlay}>
    <div style={styles.modal}>
      <img src="/images/bienvenida.png" alt="Bienvenida" style={styles.modalImage} />
      <button onClick={() => setShowWelcome(false)} style={styles.modalBtn}>
        Entrar al catálogo
      </button>
    </div>
  </div>
)}

{/* DESPUÉS — poner: */}
{showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
```

Eliminar del objeto `styles` en App.jsx solo las entradas: `modal`, `modalImage`, `modalBtn`.
⚠️ **NO eliminar `overlay`** — App.jsx todavía lo usa en el ProductModal (línea ~189). WelcomeModal tiene su propia copia de `overlay` internamente.

- [ ] **Step 3: Verificar en browser que el modal de bienvenida sigue apareciendo**

```bash
npm run dev
```
Abrir http://localhost:5173 — debe aparecer el modal con la imagen de bienvenida y el botón "Entrar al catálogo". Al hacer clic, debe cerrar.

- [ ] **Step 4: Commit**

```bash
git add src/components/WelcomeModal.jsx src/App.jsx
git commit -m "refactor: extract WelcomeModal component from App.jsx"
```

---

## Task 2: Extraer Sidebar

**Archivos:**
- Crear: `src/components/Sidebar.jsx`
- Modificar: `src/App.jsx`

- [ ] **Step 1: Crear `src/components/Sidebar.jsx`**

```jsx
import React from "react";

export default function Sidebar({ categories, selectedCategory, onSelect }) {
  return (
    <aside className="sidebar">
      {categories.map((cat) => (
        <div
          key={cat}
          onClick={() => onSelect(cat)}
          className={`category-chip${selectedCategory === cat ? " active" : ""}`}
        >
          {cat}
        </div>
      ))}
    </aside>
  );
}
```

- [ ] **Step 2: En `App.jsx` — importar y usar Sidebar**

Agregar import:
```jsx
import Sidebar from "./components/Sidebar";
```

Reemplazar en el return (líneas ~102-114):
```jsx
{/* ANTES — eliminar: */}
<aside className="sidebar">
  {categories.map((cat) => (
    <div
      key={cat}
      onClick={() => { setSelectedCategory(cat); setSearchQuery(""); }}
      className={`category-chip${selectedCategory === cat ? " active" : ""}`}
    >
      {cat}
    </div>
  ))}
</aside>

{/* DESPUÉS — poner: */}
<Sidebar
  categories={categories}
  selectedCategory={selectedCategory}
  onSelect={(cat) => { setSelectedCategory(cat); setSearchQuery(""); }}
/>
```

- [ ] **Step 3: Verificar que el sidebar de categorías funciona**

```bash
npm run dev
```
Abrir la tienda, hacer clic en distintas categorías — los productos deben filtrarse correctamente. La categoría activa debe resaltarse.

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar.jsx src/App.jsx
git commit -m "refactor: extract Sidebar component from App.jsx"
```

---

## Task 3: Extraer ProductCard

**Archivos:**
- Crear: `src/components/ProductCard.jsx`
- Modificar: `src/App.jsx`

- [ ] **Step 1: Crear `src/components/ProductCard.jsx`**

```jsx
import React from "react";

export default function ProductCard({ product, isTopSeller, onAddToCart, onClick }) {
  return (
    <div className="product-card" onClick={onClick}>
      {isTopSeller && (
        <div className="badge-top">🔥 Top Vendido</div>
      )}
      <img
        src={product.image}
        alt={product.name}
        className="product-img"
      />
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <div className="product-footer">
          <span className="price">${product.price}</span>
          <button
            className="btn-add"
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: En `App.jsx` — importar y usar ProductCard**

Agregar import:
```jsx
import ProductCard from "./components/ProductCard";
```

Reemplazar en el return (el bloque `filteredProducts.map(...)`, líneas ~124-153):
```jsx
{/* ANTES — eliminar: */}
{filteredProducts.map((product) => (
  <div
    key={product.id}
    className="product-card"
    onClick={() => setSelectedProduct(product)}
  >
    {TOP_SELLERS.has(product.id) && (
      <div className="badge-top">🔥 Top Vendido</div>
    )}
    <img src={product.image} alt={product.name} className="product-img" />
    <div className="product-card-body">
      <h3>{product.name}</h3>
      <div className="product-footer">
        <span className="price">${product.price}</span>
        <button
          className="btn-add"
          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
        >
          Agregar
        </button>
      </div>
    </div>
  </div>
))}

{/* DESPUÉS — poner: */}
{filteredProducts.map((product) => (
  <ProductCard
    key={product.id}
    product={product}
    isTopSeller={TOP_SELLERS.has(product.id)}
    onAddToCart={addToCart}
    onClick={() => setSelectedProduct(product)}
  />
))}
```

- [ ] **Step 3: Verificar que las cards de productos se muestran correctamente**

```bash
npm run dev
```
Abrir la tienda — las cards de productos deben verse igual. El badge "🔥 Top Vendido" debe aparecer en los top sellers. El botón "Agregar" debe agregar al carrito.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProductCard.jsx src/App.jsx
git commit -m "refactor: extract ProductCard component from App.jsx"
```

---

## Task 4: Extraer Cart

**Archivos:**
- Crear: `src/components/Cart.jsx`
- Modificar: `src/App.jsx`

- [ ] **Step 1: Crear `src/components/Cart.jsx`**

```jsx
import React from "react";

export default function Cart({ isOpen, cart, total, onClose, onAdd, onRemove, onCheckout }) {
  return (
    <>
      {/* Overlay oscuro detrás del carrito */}
      {isOpen && (
        <div
          style={styles.cartOverlay}
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        />
      )}

      {/* Drawer del carrito */}
      <div style={{ ...styles.cart, right: isOpen ? 0 : "-400px" }}>
        <div style={styles.cartHeader}>
          <h3>Carrito</h3>
          <button onClick={onClose}>✖</button>
        </div>

        <div style={styles.cartContent}>
          {cart.length === 0 && (
            <p style={{ padding: "20px", color: "#999", textAlign: "center" }}>
              Tu carrito está vacío
            </p>
          )}
          {cart.map((item) => (
            <div key={item.id} style={styles.cartItem}>
              {item.name} x {item.quantity}
              <div>
                <button onClick={() => onRemove(item)}>-</button>
                <button onClick={() => onAdd(item)}>+</button>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.cartFooter}>
          <b>Total: ${total}</b>
          <button
            onClick={onCheckout}
            disabled={!cart.length}
            style={{
              ...styles.checkoutBtn,
              opacity: cart.length ? 1 : 0.5,
              cursor: cart.length ? "pointer" : "not-allowed",
            }}
          >
            Finalizar compra
          </button>
        </div>
      </div>
    </>
  );
}

const styles = {
  cartOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 1050,
  },
  cart: {
    position: "fixed",
    top: 0,
    width: "350px",
    height: "100%",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    zIndex: 1100,
    transition: "right 0.3s ease",
    boxShadow: "-5px 0 20px rgba(0,0,0,0.15)",
  },
  cartHeader: {
    padding: "15px 20px",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#111",
    color: "#fff",
  },
  cartContent: { flex: 1, overflowY: "auto", padding: "10px" },
  cartItem: {
    padding: "12px 8px",
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
  },
  cartFooter: {
    padding: "15px 20px",
    borderTop: "1px solid #eee",
    background: "#fafafa",
  },
  checkoutBtn: {
    width: "100%",
    marginTop: "10px",
    padding: "13px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "15px",
  },
};
```

- [ ] **Step 2: En `App.jsx` — importar y usar Cart**

Agregar import:
```jsx
import Cart from "./components/Cart";
```

Reemplazar en el return los dos bloques del carrito (overlay + drawer, líneas ~228-274):
```jsx
{/* ANTES — eliminar ambos bloques: */}
{isCartOpen && (
  <div style={styles.cartOverlay} onClick={(e) => { ... }} />
)}
<div style={{ ...styles.cart, right: isCartOpen ? 0 : "-400px" }}>
  ...
</div>

{/* DESPUÉS — poner: */}
<Cart
  isOpen={isCartOpen}
  cart={cart}
  total={total}
  onClose={() => setIsCartOpen(false)}
  onAdd={addToCart}
  onRemove={removeFromCart}
  onCheckout={() => { setIsCartOpen(false); setShowCheckout(true); }}
/>
```

Eliminar del objeto `styles` en App.jsx: `cartOverlay`, `cart`, `cartHeader`, `cartContent`, `cartItem`, `cartFooter`, `checkoutBtn`.

- [ ] **Step 3: Verificar que el carrito funciona**

```bash
npm run dev
```
- Agregar productos al carrito → el badge del header debe actualizarse
- Abrir el carrito → debe deslizarse desde la derecha
- Aumentar/disminuir cantidades → deben funcionar
- Botón "Finalizar compra" → debe abrir el checkout

- [ ] **Step 4: Verificar que `App.jsx` redujo significativamente**

```bash
wc -l src/App.jsx
```
Debe tener menos de 200 líneas (venía de ~500).

- [ ] **Step 5: Commit**

```bash
git add src/components/Cart.jsx src/App.jsx
git commit -m "refactor: extract Cart component from App.jsx"
```

---

## Task 5: Push y verificación final

- [ ] **Step 1: Push a origin**

```bash
git push origin main
```

- [ ] **Step 2: Verificar en producción**

Abrir https://www.ludo-lounge.com y confirmar:
- Modal de bienvenida aparece al entrar
- Sidebar de categorías filtra correctamente
- Cards de productos se ven igual
- Carrito abre, suma, resta y lleva al checkout
