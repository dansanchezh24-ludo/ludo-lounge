import React, { useState } from "react";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function Checkout({ cart, clearCart, onClose }) {
  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [fetchingShipping, setFetchingShipping] = useState(false);
  const [shippingWarning, setShippingWarning] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    street: "", number: "", colony: "",
    city: "", state: "", zip: "",
    paymentMethod: "paypal",
  });

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost = selectedShipping ? selectedShipping.price : 0;
  const total = subtotal + shippingCost;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.name || !form.email) { alert("Nombre y correo requeridos"); return false; }
    if (!/^\d{10}$/.test(form.phone)) { alert("Teléfono debe tener 10 dígitos"); return false; }
    if (!/^\d{5}$/.test(form.zip)) { alert("Código postal inválido (5 dígitos)"); return false; }
    if (!form.street || !form.number || !form.colony || !form.city || !form.state) {
      alert("Completa toda la dirección"); return false;
    }
    return true;
  };

  // Cotizar envío con Skydropx
  const fetchShipping = async () => {
    if (!validate()) return;
    setFetchingShipping(true);
    setShippingOptions([]);
    setSelectedShipping(null);
    setShippingWarning("");
    try {
      const { data } = await axios.post("/api/shipping", {
        zip_to: form.zip,
        items: cart,
      });
      setShippingOptions(data.rates || []);
      if (data.warning) setShippingWarning(data.warning);
      if (data.isMock) setShippingWarning("Tarifas de prueba — activa Skydropx para cotizaciones reales");
      setStep(2);
    } catch (err) {
      alert("No se pudo cotizar el envío. Intenta de nuevo.");
    } finally {
      setFetchingShipping(false);
    }
  };

  // Crear pedido
  const createOrder = async (method) => {
    try {
      setLoading(true);
      const res = await axios.post("/api/orders", {
        ...form,
        phone: "52" + form.phone,
        paymentMethod: method,
        items: cart,
        subtotal,
        shippingCarrier: selectedShipping?.carrier,
        shippingService: selectedShipping?.service,
        shippingCost,
        total,
        status: method === "paypal" ? "pagado" : "pendiente",
      });
      setOrderId(res.data.orderId);
      clearCart();
      setStep(4);
    } catch (err) {
      console.error(err);
      alert("Error al crear pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <button onClick={onClose} style={styles.close}>✖</button>

        {/* INDICADOR DE PASOS */}
        <div style={styles.steps}>
          {["Dirección", "Envío", "Pago", "Confirmación"].map((label, i) => (
            <div key={i} style={styles.stepItem}>
              <div style={{
                ...styles.stepCircle,
                background: step > i + 1 ? "#28a745" : step === i + 1 ? "#007bff" : "#ddd",
                color: step >= i + 1 ? "#fff" : "#999",
              }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 11, color: step === i + 1 ? "#007bff" : "#999" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1 — DIRECCIÓN */}
        {step === 1 && (
          <>
            <h2 style={styles.title}>Dirección de envío</h2>
            <div style={styles.grid}>
              <input name="name"   placeholder="Nombre completo" onChange={handleChange} style={styles.input} />
              <input name="email"  placeholder="Correo"          onChange={handleChange} style={styles.input} />
              <input name="phone"  placeholder="Teléfono (10 dígitos)" onChange={handleChange} style={styles.input} />
              <input name="street" placeholder="Calle"           onChange={handleChange} style={styles.input} />
              <input name="number" placeholder="Número"          onChange={handleChange} style={styles.input} />
              <input name="colony" placeholder="Colonia"         onChange={handleChange} style={styles.input} />
              <input name="city"   placeholder="Ciudad"          onChange={handleChange} style={styles.input} />
              <input name="state"  placeholder="Estado"          onChange={handleChange} style={styles.input} />
              <input name="zip"    placeholder="Código Postal"   onChange={handleChange} style={{ ...styles.input, gridColumn: "1 / -1" }} />
            </div>

            <button onClick={fetchShipping} style={styles.btn} disabled={fetchingShipping}>
              {fetchingShipping ? "Cotizando envío..." : "Ver opciones de envío →"}
            </button>
          </>
        )}

        {/* STEP 2 — SELECCIÓN DE ENVÍO */}
        {step === 2 && (
          <>
            <h2 style={styles.title}>Elige tu envío</h2>
            <p style={styles.subtitle}>Enviamos desde Zapopan, Jalisco a CP {form.zip}</p>

            {shippingWarning && (
              <div style={styles.warningBox}>⚠️ {shippingWarning}</div>
            )}

            <div style={styles.shippingList}>
              {shippingOptions.map((rate) => (
                <div
                  key={rate.id}
                  onClick={() => setSelectedShipping(rate)}
                  style={{
                    ...styles.shippingCard,
                    borderColor: selectedShipping?.id === rate.id ? "#007bff" : "#e0e0e0",
                    background: selectedShipping?.id === rate.id ? "#f0f7ff" : "#fff",
                  }}
                >
                  <div style={styles.shippingInfo}>
                    <span style={styles.shippingCarrier}>{rate.carrier}</span>
                    <span style={styles.shippingService}>{rate.service}</span>
                    <span style={styles.shippingDays}>
                      {rate.days === "?" ? "Tiempo variable" : `${rate.days} día${rate.days !== 1 ? "s" : ""} hábil${rate.days !== 1 ? "es" : ""}`}
                    </span>
                  </div>
                  <span style={styles.shippingPrice}>${rate.price}</span>
                </div>
              ))}
            </div>

            <div style={styles.totalBox}>
              <span>Subtotal productos:</span><span>${subtotal}</span>
              <span>Envío:</span><span>{selectedShipping ? `$${selectedShipping.price}` : "—"}</span>
              <span style={{ fontWeight: 800 }}>Total:</span>
              <span style={{ fontWeight: 800, color: "#28a745" }}>${total}</span>
            </div>

            <button
              onClick={() => setStep(3)}
              style={styles.btn}
              disabled={!selectedShipping}
            >
              Continuar a pago →
            </button>
            <button onClick={() => setStep(1)} style={styles.backBtn}>← Cambiar dirección</button>
          </>
        )}

        {/* STEP 3 — PAGO */}
        {step === 3 && (
          <>
            <h2 style={styles.title}>Pago</h2>

            <div style={styles.totalBox}>
              <span>Subtotal:</span><span>${subtotal}</span>
              <span>Envío ({selectedShipping?.carrier}):</span><span>${shippingCost}</span>
              <span style={{ fontWeight: 800 }}>Total a pagar:</span>
              <span style={{ fontWeight: 800, color: "#28a745", fontSize: 18 }}>${total}</span>
            </div>

            <div style={styles.paymentBox}>
              <label style={styles.paymentOption}>
                <input type="radio" checked={form.paymentMethod === "paypal"}
                  onChange={() => setForm({ ...form, paymentMethod: "paypal" })} />
                PayPal
              </label>
              <label style={styles.paymentOption}>
                <input type="radio" checked={form.paymentMethod === "transferencia"}
                  onChange={() => setForm({ ...form, paymentMethod: "transferencia" })} />
                Transferencia
              </label>
            </div>

            {/* PAYPAL */}
            {form.paymentMethod === "paypal" && (
              <PayPalScriptProvider options={{ "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID, currency: "MXN" }}>
                <div style={{ marginTop: 10 }}>
                  <PayPalButtons
                    style={{ layout: "vertical" }}
                    forceReRender={[total]}
                    createOrder={(data, actions) =>
                      actions.order.create({ purchase_units: [{ amount: { value: total.toString() } }] })
                    }
                    onApprove={async (data, actions) => {
                      await actions.order.capture();
                      await createOrder("paypal");
                    }}
                    onError={(err) => { console.error(err); alert("Error en PayPal"); }}
                  />
                </div>
              </PayPalScriptProvider>
            )}

            {/* TRANSFERENCIA */}
            {form.paymentMethod === "transferencia" && (
              <>
                <div style={styles.transferBox}>
                  <p><b>Mercado Pago W</b></p>
                  <p>BENEFICIARIO: Laura Sofia Rodriguez Quintana</p>
                  <p>CLABE: 722969015506648176</p>
                  <p style={{ marginTop: 8, color: "#28a745", fontWeight: 700 }}>
                    Total a transferir: ${total}
                  </p>
                </div>
                <button onClick={() => createOrder("transferencia")} style={styles.btn} disabled={loading}>
                  {loading ? "Procesando..." : "Confirmar pedido"}
                </button>
              </>
            )}

            <button onClick={() => setStep(2)} style={styles.backBtn}>← Cambiar envío</button>
          </>
        )}

        {/* STEP 4 — CONFIRMACIÓN */}
        {step === 4 && (
          <div style={styles.success}>
            <div style={styles.successIcon}>🎉</div>
            <h2>¡Pedido confirmado!</h2>
            <p style={{ color: "#666", margin: "8px 0" }}>Folio: <b>{orderId}</b></p>
            <div style={styles.confirmBox}>
              <p>📦 <b>{selectedShipping?.carrier}</b> — {selectedShipping?.service}</p>
              <p>
                {selectedShipping?.days === "?"
                  ? "Tiempo de entrega variable"
                  : `Entrega en ${selectedShipping?.days} día(s) hábil(es)`}
              </p>
              <p style={{ marginTop: 8, fontWeight: 700 }}>Total cobrado: ${total}</p>
            </div>
            <p style={{ fontSize: 13, color: "#888", margin: "12px 0" }}>
              Te enviaremos un correo a <b>{form.email}</b> con los detalles.
            </p>
            <button onClick={onClose} style={styles.btn}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 99999, padding: "10px",
  },
  container: {
    background: "#fff", padding: "24px", borderRadius: "14px",
    width: "100%", maxWidth: "520px", maxHeight: "92vh", overflowY: "auto",
  },
  close: { float: "right", border: "none", background: "none", fontSize: "20px", cursor: "pointer" },
  title: { margin: "12px 0 16px", fontSize: 20, fontWeight: 800 },
  subtitle: { color: "#666", fontSize: 13, marginBottom: 12 },

  // Pasos
  steps: { display: "flex", justifyContent: "space-between", marginBottom: 20, paddingTop: 4 },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 },
  stepCircle: {
    width: 28, height: 28, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700,
  },

  // Formulario
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: 14, width: "100%" },

  // Opciones de envío
  shippingList: { display: "flex", flexDirection: "column", gap: 10, margin: "12px 0" },
  shippingCard: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 16px", borderRadius: 10, border: "2px solid #e0e0e0",
    cursor: "pointer", transition: "all 0.15s",
  },
  shippingInfo: { display: "flex", flexDirection: "column", gap: 2 },
  shippingCarrier: { fontWeight: 700, fontSize: 15, color: "#111" },
  shippingService: { fontSize: 12, color: "#666" },
  shippingDays: { fontSize: 12, color: "#28a745" },
  shippingPrice: { fontWeight: 800, fontSize: 18, color: "#007bff" },

  // Totales
  totalBox: {
    display: "grid", gridTemplateColumns: "1fr auto",
    gap: "6px 16px", background: "#f8f8f8",
    padding: "14px 16px", borderRadius: 10, margin: "12px 0", fontSize: 14,
  },

  // Pago
  paymentBox: { display: "flex", gap: 20, margin: "12px 0" },
  paymentOption: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 15 },
  transferBox: { background: "#f5f5f5", padding: 12, borderRadius: 8, fontSize: 14, margin: "10px 0" },

  // Warning
  warningBox: {
    background: "#fff8e1", border: "1px solid #ffe082",
    borderRadius: 8, padding: "10px 14px", fontSize: 13,
    color: "#7a6000", marginBottom: 10,
  },

  // Confirmación
  success: { textAlign: "center", padding: "20px 0" },
  successIcon: { fontSize: 52, marginBottom: 8 },
  confirmBox: {
    background: "#f0f7ff", borderRadius: 10, padding: "14px 16px",
    margin: "16px 0", fontSize: 14, textAlign: "left", lineHeight: 1.8,
  },

  // Botones
  btn: {
    width: "100%", padding: 13, background: "#28a745", color: "#fff",
    border: "none", marginTop: 10, borderRadius: 8, cursor: "pointer",
    fontWeight: 700, fontSize: 15,
  },
  backBtn: {
    width: "100%", padding: 10, marginTop: 8, borderRadius: 8,
    background: "none", border: "1px solid #ddd", cursor: "pointer", color: "#666",
  },
};
