import React from "react";

const Header = ({ cartCount, onCartClick, searchQuery, onSearchChange }) => {
  return (
    <header className="site-header">
      {/* LOGO */}
      <img
        src="/images/nuevologoludolounge-encabezadopagina.jpeg"
        alt="Ludo Lounge"
        className="header-logo"
      />

      {/* TAGLINE + BUSCADOR */}
      <div className="header-center">
        <p className="header-tagline">el juego correcto, sin la búsqueda eterna</p>
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
  );
};

export default Header;
