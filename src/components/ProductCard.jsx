import React from "react";

export default function ProductCard({ product, isTopSeller, onAddToCart, onClick }) {
  return (
    <div className="product-card" onClick={onClick}>
      {isTopSeller && (
        <div className="badge-top">🔥 Top Vendido</div>
      )}
      <img
        src={product.image}
        alt={product.name}
        className="product-img"
      />
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <div className="product-footer">
          <span className="price">${product.price}</span>
          <button
            className="btn-add"
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
