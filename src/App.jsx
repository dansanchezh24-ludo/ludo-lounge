// ===============================
// LUDO - TIENDA CON CARRITO + CATEGORÍAS
// READY FOR VERCEL 🚀
// ===============================

// ---------- src/App.jsx ----------
import React, { useState } from "react";

const catalog = {
  "Niños": [
    { name: "Detecteam: Un huevo de más", price: 500 },
    { name: "El Rebaño", price: 600 },
    { name: "Toma 6 Junior", price: 575 },
    { name: "Worm Up", price: 700 },
    { name: "Ouch!", price: 380 },
    { name: "Caperucita Roja", price: 900 },
    { name: "Galletas", price: 600 },
    { name: "El juego de las profesiones", price: 500 }
  ],

  "Familiar": [
    { name: "Sushi Express", price: 725 },
    { name: "Grua de Peluches", price: 600 },
    { name: "Cats Knocking Things Off Ledges", price: 600 },
    { name: "Da Da Da", price: 420 },
    { name: "Telestrations", price: 900 }
  ],

  "Adolescentes": [
    { name: "Yummy Kitty", price: 500 },
    { name: "Pingüinos", price: 1200 },
    { name: "Taco Loco", price: 500 },
    { name: "Yo Soy Tu Peli", price: 670 },
    { name: "Break the Code", price: 540 },
    { name: "Truth or Drink", price: 650 }
  ],

  "Adultos": [
    { name: "Mesa para Dos", price: 670 },
    { name: "Happy Chupe", price: 670 },
    { name: "Exit: Sherlock Holmes", price: 550 },
    { name: "Medical Mysteries Miami", price: 850 },
    { name: "Medical Mysteries New York", price: 850 },
    { name: "Marvel Dice Throne Deadpool", price: 800 },
    { name: "Petals", price: 500 }
  ],

  "Agilidad Mental": [
    { name: "IQ Circuit", price: 420 },
    { name: "IQ Stars", price: 420 },
    { name: "IQ Digits", price: 480 },
    { name: "IQ XOXO", price: 420 },
    { name: "Quadrillion", price: 750 }
  ],

  "Polys": [
    { name: "Barbie", price: 850 },
    { name: "Stitch", price: 750 },
    { name: "Pokemon", price: 850 },
    { name: "Señor de los Anillos", price: 970 },
    { name: "Casa del Dragón", price: 900 },
    { name: "Harry Potter", price: 920 },
    { name: "Villanos Disney", price: 950 },
    { name: "FIFA", price: 1250 }
  ],

  "Cartas": [
    { name: "UNO Quatro", price: 700 },
    { name: "UNO Stacko", price: 450 },
    { name: "UNO Spin", price: 650 },
    { name: "UNO Liar's", price: 650 },
    { name: "UNO Golf", price: 630 },
    { name: "UNO Dare!", price: 530 }
  ]
};

export default function App() {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1 style={{ textAlign: "center" }}>LUDO 🎲</h1>
      <h3 style={{ textAlign: "center" }}>Catálogo de Juegos</h3>

      {/* CART */}
      <div style={{ position: "fixed", top: 20, right: 20, background: "white", padding: "15px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}>
        <h4>🛒 Carrito</h4>
        <p>{cart.length} productos</p>
        <p>Total: ${total}</p>
      </div>

      {Object.entries(catalog).map(([category, items]) => (
        <div key={category} style={{ marginTop: "30px" }}>
          <h2>{category}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "15px" }}>
            {items.map((p, i) => (
              <div key={i} style={{ background: "white", padding: "15px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <h4>{p.name}</h4>
                <p>${p.price}</p>
                <button onClick={() => addToCart(p)} style={{ padding: "8px", background: "black", color: "white", borderRadius: "6px" }}>
                  Agregar
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===============================
// 🚀 DEPLOY
// npm install
// npm run dev
// npx vercel
// ===============================