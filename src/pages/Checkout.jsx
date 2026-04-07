import React, { useState } from "react";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function Checkout({ cart, clearCart, onClose }) {
  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    number: "",
    colony: "",
    city: "",
    state: "",
    zip: "",
    paymentMethod: "paypal",
  });

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 VALIDACIÓN PRO MÉXICO
  const validate = () => {
    if (!form.name || !form.email) {
      alert("Nombre y correo requeridos");
      return false;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      alert("Teléfono debe tener 10 dígitos");
      return false;
    }

    if (!/^\d{5}$/.test(form.zip)) {
      alert("Código postal inválido (5 dígitos)");
      return false;
    }

    if (
      !form.street ||
      !form.number ||
      !form.colony ||
      !form.city ||
      !form.state
    ) {
      alert("Completa toda la dirección");
      return false;
    }

    return true;
  };

  // 🔥 CREAR PEDIDO
  const createOrder = async (method) => {
    try {
      setLoading(true);

      const res = await axios.post("/api/orders", {
        ...form,
        phone: "52" + form.phone,
        paymentMethod: method,
        items: cart,
        total,
        status: method === "paypal" ? "pagado" : "pendiente",
      });

      setOrderId(res.data.orderId);
      clearCart();
      setStep(3);
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

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <h2>Dirección de envío</h2>

            <div style={styles.grid}>
              <input name="name" placeholder="Nombre completo" onChange={handleChange} style={styles.input}/>
              <input name="email" placeholder="Correo" onChange={handleChange} style={styles.input}/>
              <input name="phone" placeholder="Teléfono (10 dígitos)" onChange={handleChange} style={styles.input}/>
              <input name="street" placeholder="Calle" onChange={handleChange} style={styles.input}/>
              <input name="number" placeholder="Número" onChange={handleChange} style={styles.input}/>
              <input name="colony" placeholder="Colonia" onChange={handleChange} style={styles.input}/>
              <input name="city" placeholder="Ciudad" onChange={handleChange} style={styles.input}/>
              <input name="state" placeholder="Estado" onChange={handleChange} style={styles.input}/>
              <input name="zip" placeholder="Código Postal" onChange={handleChange} style={styles.input}/>
            </div>

            <button
              onClick={() => validate() && setStep(2)}
              style={styles.btn}
            >
              Continuar a pago
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <h2>Pago</h2>

            <div style={styles.paymentBox}>
              <label>
                <input
                  type="radio"
                  checked={form.paymentMethod === "paypal"}
                  onChange={() =>
                    setForm({ ...form, paymentMethod: "paypal" })
                  }
                />
                PayPal
              </label>

              <label>
                <input
                  type="radio"
                  checked={form.paymentMethod === "transferencia"}
                  onChange={() =>
                    setForm({ ...form, paymentMethod: "transferencia" })
                  }
                />
                Transferencia
              </label>
            </div>

            <h3>Total: {total}</h3>

            {/* PAYPAL */}
            {form.paymentMethod === "paypal" && (
              <PayPalScriptProvider
                options={{
                  "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
                  currency: "MXN",
                }}
              >
                <div style={{ marginTop: "10px" }}>
                  <PayPalButtons
                    style={{ layout: "vertical" }}
                    forceReRender={[total]}

                    createOrder={(data, actions) => {
                      return actions.order.create({
                        purchase_units: [
                          {
                            amount: { value: total.toString() },
                          },
                        ],
                      });
                    }}

                    onApprove={async (data, actions) => {
                      await actions.order.capture();
                      await createOrder("paypal");
                    }}

                    onError={(err) => {
                      console.error(err);
                      alert("Error en PayPal");
                    }}
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
                </div>

                <button
                  onClick={() => createOrder("transferencia")}
                  style={styles.btn}
                >
                  Confirmar pedido
                </button>
              </>
            )}

            <button onClick={() => setStep(1)} style={styles.backBtn}>
              Regresar
            </button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={styles.success}>
            <h2>Pedido confirmado 🎉</h2>
            <p>Folio: {orderId}</p>

            <button onClick={onClose} style={styles.btn}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
    padding: "10px",
  },

  container: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflowY: "auto",
  },

  close: {
    float: "right",
    border: "none",
    background: "none",
    fontSize: "18px",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },

  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },

  btn: {
    width: "100%",
    padding: "12px",
    background: "#28a745",
    color: "#fff",
    border: "none",
    marginTop: "10px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  backBtn: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "6px",
  },

  paymentBox: {
    display: "flex",
    justifyContent: "space-around",
    margin: "10px 0",
  },

  transferBox: {
    background: "#f5f5f5",
    padding: "10px",
    borderRadius: "6px",
  },

  success: {
    textAlign: "center",
  },
};