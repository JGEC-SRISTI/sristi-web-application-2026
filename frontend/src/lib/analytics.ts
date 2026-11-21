const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

export function initializeAnalytics() {
  if (!measurementId || typeof window === "undefined" || window.gtag) {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };

  window.gtag("js", new Date());
  // Page views are sent manually by the router so OAuth fragments and query
  // parameters are never included in the analytics page_location.
  window.gtag("config", measurementId, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

export function trackPageView(pathname: string) {
  if (!measurementId || !window.gtag) return;

  window.gtag("event", "page_view", {
    page_title: document.title,
    page_location: `${window.location.origin}${pathname}`,
  });
}

export function trackSignUp(method = "google") {
  if (!measurementId || !window.gtag) return;

  window.gtag("event", "sign_up", { method });
}
