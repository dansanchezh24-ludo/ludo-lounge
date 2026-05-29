import React, { useState } from "react";

const Header = ({ cartCount, onCartClick, searchQuery, onSearchChange }) => {
  const [logoOpen, setLogoOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        {/* TAGLINE + BUSCADOR */}
        <div className="header-left">
          <p className="header-tagline">"El Juego Correcto, Sin La Búsqueda Eterna"</p>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar juego..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => onSearchChange("")}>✕</button>
            )}
          </div>
        </div>

        {/* LOGO CENTRO */}
        <img
          src="/images/nuevologoludolounge-encabezadopagina.jpeg"
          alt="Ludo Lounge"
          className="header-logo"
          draggable="false"
          onClick={() => setLogoOpen(true)}
        />

        {/* CARRITO */}
        <button className="cart-btn" onClick={onCartClick}>
          <span className="cart-icon-wrap">
            <img
              src="/images/logocarritodecompras.jpeg"
              alt="Carrito"
              className="cart-img"
            />
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </span>
        </button>
      </header>

      {/* MODAL LOGO */}
      {logoOpen && (
        <div className="logo-modal-overlay" onClick={() => setLogoOpen(false)}>
          <div className="logo-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="logo-modal-close" onClick={() => setLogoOpen(false)}>✕</button>
            <img
              src="/images/nuevologoludolounge-encabezadopagina.jpeg"
              alt="Ludo Lounge"
              className="logo-modal-img"
              draggable="false"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
