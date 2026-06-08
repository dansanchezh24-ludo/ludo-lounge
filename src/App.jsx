import React, { useState, useEffect } from "react";
import { products } from "./data/products";
import Checkout from "./pages/Checkout";
import Header from "./components/Header";
import WelcomeModal from "./components/WelcomeModal";
import Sidebar from "./components/Sidebar";
import ProductCard from "./components/ProductCard";
import Cart from "./components/Cart";

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

  const categoryOrder = ["Todos", "🔥 Top", "UNO", "Monopoly", "Catan", "Familiar", "Adultos", "Adolescentes", "Niños", "Agilidad Mental", "Casino"];
  const categories = categoryOrder.filter(c => c === "Todos" || c === "🔥 Top" || products.some(p => p.category === c));

  const filteredProducts = products.filter(p => {
    const matchesCategory =
      selectedCategory === "Todos" ||
      (selectedCategory === "🔥 Top" ? TOP_SELLERS.has(p.id) : p.category === selectedCategory);
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
      {/* BIENVENIDA */}
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

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
        <Sidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={(cat) => { setSelectedCategory(cat); setSearchQuery(""); }}
        />

        {/* PRODUCTOS */}
        <main className="products-area">
          {searchQuery && (
            <p style={styles.searchInfo}>
              {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""} para "<strong>{searchQuery}</strong>"
            </p>
          )}
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isTopSeller={TOP_SELLERS.has(product.id)}
                onAddToCart={addToCart}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/images/nuevologoludolounge-encabezadopagina.jpeg" alt="Ludo Lounge" className="footer-logo" />
            <p className="footer-tagline">"El Juego Correcto, Sin La Búsqueda Eterna"</p>
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

      <Cart
        isOpen={isCartOpen}
        cart={cart}
        total={total}
        onClose={() => setIsCartOpen(false)}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onCheckout={() => { setIsCartOpen(false); setShowCheckout(true); }}
      />

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

  productModal: {
    background: "#fff",
    borderRadius: "16px",
    maxWidth: "500px",
    width: "100%",
    overflow: "hidden",
    position: "relative",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
  },

  closeBtn: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    fontSize: "14px",
    cursor: "pointer",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  modalBadge: {
    position: "absolute",
    top: "12px",
    left: "12px",
    background: "#ff6b00",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "800",
    padding: "4px 10px",
    borderRadius: "20px",
    zIndex: 10,
    letterSpacing: "0.3px",
  },

  productModalImg: {
    width: "100%",
    maxHeight: "300px",
    objectFit: "contain",
    display: "block",
    flexShrink: 0,
    background: "#f8f8f8",
    padding: "10px",
  },

  productModalBody: {
    padding: "20px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  productModalName: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#111",
    lineHeight: "1.2",
  },

  productModalDesc: {
    fontSize: "14px",
    color: "#555",
    lineHeight: "1.6",
  },

  productModalFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "4px",
    gap: "12px",
  },

  productModalPrice: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#28a745",
  },

  productModalBtn: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 20px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  searchInfo: {
    padding: "10px 20px 0",
    fontSize: "13px",
    color: "#666",
  },
};
