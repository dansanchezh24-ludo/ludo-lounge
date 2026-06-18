import { useState, useEffect } from "react";
import { trackEvent } from "./GoogleAnalytics";

const STORAGE_KEY = "ll_email_popup_shown";
const DELAY_MS = 30000;

export default function EmailPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        trackEvent("email_signup", { method: "popup" });
        setTimeout(close, 2500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (!visible) return null;

  return (
    <div className="popup-overlay" onClick={close}>
      <div className="popup-box" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={close} aria-label="Cerrar">✕</button>

        {status === "success" ? (
          <div className="popup-success">
            <span className="popup-success-icon">🎲</span>
            <p>¡Listo! Te avisaremos de ofertas y novedades.</p>
          </div>
        ) : (
          <>
            <p className="popup-eyebrow">Ofertas exclusivas</p>
            <h2 className="popup-title">10% de descuento<br />en tu primer pedido</h2>
            <p className="popup-sub">Suscríbete y sé el primero en enterarte de nuevos juegos y promociones.</p>
            <form className="popup-form" onSubmit={handleSubmit}>
              <input
                type="email"
                className="popup-input"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <button
                type="submit"
                className="popup-btn"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Enviando…" : "Quiero mi descuento"}
              </button>
            </form>
            {status === "error" && (
              <p className="popup-error">Algo salió mal, intenta de nuevo.</p>
            )}
            <p className="popup-legal">Sin spam. Puedes darte de baja cuando quieras.</p>
          </>
        )}
      </div>
    </div>
  );
}
