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
