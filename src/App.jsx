import React, { useState, useEffect } from "react";
import { products } from "./data/products";
import Checkout from "./pages/Checkout";
import Header from "./components/Header";
import Admin from "./pages/Admin";

export default function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setIsCartOpen(false);
        setShowCheckout(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  if (isAdmin) return <Admin />;

  const categories = ["Todos", ...new Set(products.map(p => p.category))];

  const filteredProducts =
    selectedCategory === "Todos"
      ? products
      : products.filter(p => p.category === selectedCategory);

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
        cartCount={cart.length}
        onCartClick={() => {
          setIsCartOpen(!isCartOpen);
          setShowCheckout(false);
        }}
      />

      <div style={styles.layout}>
        {/* SIDEBAR */}
        <aside style={styles.sidebar}>
          {categories.map((cat) => (
            <div
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                ...styles.categoryItem,
                background:
                  selectedCategory === cat ? "#28a745" : "transparent",
              }}
            >
              {cat}
            </div>
          ))}
        </aside>

        {/* PRODUCTOS */}
        <main style={styles.main}>
          <div style={styles.grid}>
            {filteredProducts.map((product) => (
              <div key={product.id} style={styles.card}>
                <img src={product.image} style={styles.productImg} />
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <b>${product.price}</b>

                <button onClick={() => addToCart(product)} style={styles.btn}>
                  Agregar
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* CARRITO */}
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
            style={styles.checkoutBtn}
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
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.85)",
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

  layout: { display: "flex" },

  sidebar: {
    width: "220px",
    background: "#111",
    color: "#fff",
    height: "100vh",
    position: "sticky",
    top: 0,
    padding: "15px",
  },

  categoryItem: {
    padding: "12px",
    borderBottom: "1px solid #333",
    cursor: "pointer",
  },

  main: { flex: 1, padding: "20px" },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    gap: "20px",
  },

  card: {
    background: "#fff",
    padding: "15px",
    borderRadius: "10px",
  },

  productImg: {
    width: "100%",
    height: "150px",
    objectFit: "cover",
  },

  btn: {
    marginTop: "10px",
    background: "#28a745",
    color: "#fff",
    padding: "10px",
    border: "none",
    borderRadius: "5px",
  },

  cart: {
    position: "fixed",
    top: 0,
    width: "350px",
    height: "100%",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    zIndex: 1000,
  },

  cartHeader: {
    padding: "10px",
    borderBottom: "1px solid #ddd",
    display: "flex",
    justifyContent: "space-between",
  },

  cartContent: { flex: 1, overflowY: "auto" },

  cartItem: {
    padding: "10px",
    borderBottom: "1px solid #eee",
  },

  cartFooter: {
    padding: "10px",
    borderTop: "1px solid #ddd",
  },

  checkoutBtn: {
    width: "100%",
    marginTop: "10px",
    padding: "12px",
    background: "#007bff",
    color: "#fff",
    border: "none",
  },

  cartOverlay: {
    position: "fixed",
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
  },
};