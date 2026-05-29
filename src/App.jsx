import React, { useState, useEffect } from "react";
import { products } from "./data/products";
import Checkout from "./pages/Checkout";
import Header from "./components/Header";
import Admin from "./pages/Admin";

// IDs de los top 10 más vendidos (al menos 1 por categoría)
const TOP_SELLERS = new Set([111, 101, 62, 81, 39, 29, 6, 41, 54, 50]);
// 111=UNO Clásico, 101=Monopoly HP, 62=Catan Clásico, 81=Telestrations,
// 39=Truth or Drink, 29=Star Wars Mandalorian, 6=Caperucita Roja,
// 41=IQ Digits, 54=Casino Venecia, 50=Colour Code

export default function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setIsCartOpen(false);
        setShowCheckout(false);
        setSelectedProduct(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  if (isAdmin) return <Admin />;

  const categoryOrder = ["Todos", "UNO", "Monopoly", "Catan", "Familiar", "Adultos", "Adolescentes", "Niños", "Agilidad Mental", "Casino"];
  const categories = categoryOrder.filter(c => c === "Todos" || products.some(p => p.category === c));

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
    const matchesSearch = searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product) => {
    const exist = cart.find(i => i.id === product.id);
    if (exist) {
      setCart(cart.map(i =>
        i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (product) => {
    const exist = cart.find(i => i.id === product.id);
    if (exist.quantity === 1) {
      setCart(cart.filter(i => i.id !== product.id));
    } else {
      setCart(cart.map(i =>
        i.id === product.id ? { ...i, quantity: i.quantity - 1 } : i
      ));
    }
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <>
      {/* ADMIN */}
      <div style={styles.adminAccess}>
        <button onClick={() => setIsAdmin(true)}>⚙️</button>
      </div>

      {/* BIENVENIDA */}
      {showWelcome && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <img
              src="/images/bienvenida.png"
              alt="Bienvenida"
              style={styles.modalImage}
            />
            <button
              onClick={() => setShowWelcome(false)}
              style={styles.modalBtn}
            >
              Entrar al catálogo
            </button>
          </div>
        </div>
      )}

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
      />

      <div className="app-layout">
        {/* SIDEBAR / CATEGORÍAS */}
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

        {/* PRODUCTOS */}
        <main className="products-area">
          {searchQuery && (
            <p style={styles.searchInfo}>
              {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""} para "<strong>{searchQuery}</strong>"
            </p>
          )}
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => setSelectedProduct(product)}
              >
                {/* BADGE TOP VENDIDO */}
                {TOP_SELLERS.has(product.id) && (
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
                      onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/images/nuevologoludolounge-encabezadopagina.jpeg" alt="Ludo Lounge" className="footer-logo" />
            <p className="footer-tagline">el juego correcto, sin la búsqueda eterna</p>
          </div>
          <div className="footer-links">
            <a
              href="https://www.instagram.com/ludolounge.mx"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              <span className="footer-link-icon">📸</span> @ludolounge.mx
            </a>
            <a
              href="https://wa.me/523339077064"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              <span className="footer-link-icon">📞</span> +52 (33) 3907 7064
            </a>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} Ludo Lounge — Todos los derechos reservados</p>
        </div>
      </footer>

      {/* MODAL DETALLE PRODUCTO */}
      {selectedProduct && (
        <div
          style={styles.overlay}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            style={styles.productModal}
            className="product-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={styles.closeBtn}
              onClick={() => setSelectedProduct(null)}
            >
              ✕
            </button>
            {TOP_SELLERS.has(selectedProduct.id) && (
              <div style={styles.modalBadge}>🔥 Top Vendido</div>
            )}
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              style={styles.productModalImg}
            />
            <div style={styles.productModalBody}>
              <h2 style={styles.productModalName}>{selectedProduct.name}</h2>
              <p style={styles.productModalDesc}>{selectedProduct.description}</p>
              <div style={styles.productModalFooter}>
                <span style={styles.productModalPrice}>${selectedProduct.price}</span>
                <button
                  style={styles.productModalBtn}
                  onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                >
                  Agregar al carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CARRITO OVERLAY */}
      {isCartOpen && (
        <div
          style={styles.cartOverlay}
          onClick={(e) => {
            e.stopPropagation();
            setIsCartOpen(false);
          }}
        />
      )}

      <div style={{ ...styles.cart, right: isCartOpen ? 0 : "-400px" }}>
        <div style={styles.cartHeader}>
          <h3>Carrito</h3>
          <button onClick={() => setIsCartOpen(false)}>✖</button>
        </div>

        <div style={styles.cartContent}>
          {cart.length === 0 && (
            <p style={{ padding: "20px", color: "#999", textAlign: "center" }}>Tu carrito está vacío</p>
          )}
          {cart.map((item) => (
            <div key={item.id} style={styles.cartItem}>
              {item.name} x {item.quantity}
              <div>
                <button onClick={() => removeFromCart(item)}>-</button>
                <button onClick={() => addToCart(item)}>+</button>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.cartFooter}>
          <b>Total: ${total}</b>

          <button
            onClick={() => {
              setIsCartOpen(false);
              setShowCheckout(true);
            }}
            disabled={!cart.length}
            style={{ ...styles.checkoutBtn, opacity: cart.length ? 1 : 0.5, cursor: cart.length ? "pointer" : "not-allowed" }}
          >
            Finalizar compra
          </button>
        </div>
      </div>

      {/* CHECKOUT */}
      {showCheckout ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999 }}>
          <Checkout
            cart={cart}
            clearCart={() => setCart([])}
            onClose={() => setShowCheckout(false)}
          />
        </div>
      ) : null}
    </>
  );
}

const styles = {
  adminAccess: { position: "fixed", bottom: 10, right: 10, zIndex: 9999 },

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
    fontSi