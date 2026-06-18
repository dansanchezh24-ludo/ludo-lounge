import { useEffect } from "react";

const GA4_ID = import.meta.env.VITE_GA4_ID;

export function gtag(...args) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

export function trackEvent(eventName, params = {}) {
  gtag("event", eventName, params);
}

export default function GoogleAnalytics() {
  useEffect(() => {
    if (!GA4_ID) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA4_ID, { page_path: window.location.pathname });
  }, []);

  return null;
}
