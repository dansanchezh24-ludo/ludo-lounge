import React from "react";
import { trackEvent } from "./GoogleAnalytics";

const WA_NUMBER = "523339077064";

function buildShareUrl(product) {
  const msg = `🎲 *${product.name}* — $${product.price} MXN\n\nLo encontré en Ludo Lounge 👉 https://www.ludo-lounge.com`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export default function ProductCard({ product, isTopSeller, onAddToCart, onClick }) {
  const handleShare = (e) => {
    e.stopPropagation();
    trackEvent("share_product", { item_id: product.id, item_name: product.name, method: "whatsapp" });
    window.open(buildShareUrl(product), "_blank", "noopener,noreferrer");
  };

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
          <div className="product-actions">
            <button
              className="btn-share"
              onClick={handleShare}
              title="Compartir por WhatsApp"
              aria-label="Compartir por WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.534 5.858L.057 23.428a.5.5 0 0 0 .609.61l5.7-1.496A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.145-1.425l-.368-.22-3.821 1.003 1.02-3.71-.24-.381A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
            </button>
            <button
              className="btn-add"
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
