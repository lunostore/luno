export const GA_TRACKING_ID =
  process.env.NEXT_PUBLIC_GA_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
  "G-H2HP3BGKNW";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper — fires any gtag event safely
// ─────────────────────────────────────────────────────────────────────────────
function fireGtag(eventName: string, params: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", eventName, params);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GA4 item object shape
// ─────────────────────────────────────────────────────────────────────────────
export interface GA4Item {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;    // e.g. "M / Black"
  price?: number;
  quantity?: number;
  currency?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page view
// ─────────────────────────────────────────────────────────────────────────────
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("config", GA_TRACKING_ID, { page_path: url });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Generic event (backward compatible)
// ─────────────────────────────────────────────────────────────────────────────
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}) => {
  fireGtag(action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 🛒 E-COMMERCE EVENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Fired when a user opens a product detail page / modal */
export const viewItem = (item: GA4Item) => {
  fireGtag("view_item", {
    currency: "EGP",
    value: item.price ?? 0,
    items: [item],
  });
};

/** Fired when a user adds a product to the cart */
export const addToCart = (item: GA4Item) => {
  fireGtag("add_to_cart", {
    currency: "EGP",
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [item],
  });
};

/** Fired when a user removes a product from the cart */
export const removeFromCart = (item: GA4Item) => {
  fireGtag("remove_from_cart", {
    currency: "EGP",
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [item],
  });
};

/** Fired when a user saves a product to the wishlist */
export const addToWishlist = (item: GA4Item) => {
  fireGtag("add_to_wishlist", {
    currency: "EGP",
    value: item.price ?? 0,
    items: [item],
  });
};

/** Fired when the user reaches the checkout page */
export const beginCheckout = (items: GA4Item[], value: number) => {
  fireGtag("begin_checkout", {
    currency: "EGP",
    value,
    items,
  });
};

/** Fired after a successful order is placed */
export const purchase = ({
  transaction_id,
  value,
  shipping,
  items,
}: {
  transaction_id: string;
  value: number;
  shipping?: number;
  items: GA4Item[];
}) => {
  fireGtag("purchase", {
    transaction_id,
    currency: "EGP",
    value,
    shipping: shipping ?? 0,
    items,
  });
};

/** Fired when a user searches the store */
export const search = (searchTerm: string) => {
  fireGtag("search", { search_term: searchTerm });
};

