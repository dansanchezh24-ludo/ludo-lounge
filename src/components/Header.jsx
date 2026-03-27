import React from "react";

const Header = ({ cartCount, onCartClick }) => {
  return (
    <header style={styles.header}>
      {/* LOGO / MARCA */}
      <div style={styles.logo}>
        🎲 Ludo Lounge
      </div>

      {/* ACCIONES */}
      <div style={styles.actions}>
        <button style={styles.cartBtn} onClick={onCartClick}>
          🛒 Carrito ({cartCount})
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: {
    position: "sticky",
    top: 0,
    background: "#111",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 25px",
    zIndex: 1000,
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  actions: {
    display: "flex",
    gap: "10px",
  },
  cartBtn: {
    background: "#28a745",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default Header;