import React from "react";

const Header = ({ cartCount, onCartClick }) => {
  return (
    <header className="site-header">
      {/* LOGO */}
      <img
        src="/images/nuevologoludolounge-encabezadopagina.jpeg"
        alt="Ludo Lounge"
        className="header-logo"
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
  );
};

export default Header;
