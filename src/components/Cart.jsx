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
