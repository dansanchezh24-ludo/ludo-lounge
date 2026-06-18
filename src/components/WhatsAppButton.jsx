import React from "react";
import { trackEvent } from "./GoogleAnalytics";

const WA_NUMBER = "523339077064";
const WA_MESSAGE = "¡Hola! Me gustaría saber más sobre sus juegos de mesa 🎲";

export default function WhatsAppButton() {
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;

  const handleClick = () => {
    trackEvent("whatsapp_click", { method: "floating_button" });
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Contáctanos por WhatsApp"
      onClick={handleClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width="32"
        height="32"
        fill="white"
      >
        <path d="M16 0C7.164 0 0 7.163 0 16c0 2.822.736 5.478 2.027 7.788L0 32l8.418-2.007A15.93 15.93 0 0 0 16 32c8.836 0 16-7.163 16-16S24.836 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.77-1.847l-.486-.289-5.002 1.192 1.27-4.848-.317-.499A13.24 13.24 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.952c-.398-.199-2.356-1.162-2.72-1.294-.365-.133-.63-.199-.896.199-.265.398-1.03 1.294-1.263 1.56-.232.265-.465.298-.863.1-.398-.199-1.681-.62-3.203-1.977-1.184-1.057-1.983-2.362-2.216-2.76-.232-.398-.025-.613.175-.811.18-.178.398-.465.597-.697.199-.232.265-.398.398-.664.133-.265.066-.498-.033-.697-.1-.199-.896-2.16-1.228-2.957-.323-.776-.65-.671-.896-.683l-.763-.013c-.265 0-.697.1-1.063.498-.365.398-1.394 1.362-1.394 3.322s1.428 3.854 1.627 4.12c.199.265 2.81 4.29 6.806 6.017.951.41 1.692.655 2.27.839.954.304 1.822.261 2.509.158.765-.114 2.356-.964 2.688-1.894.332-.93.332-1.727.232-1.894-.099-.166-.365-.265-.763-.465z" />
      </svg>
    </a>
  );
}
