"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import ProductDetailClient from "@/components/store/ProductDetailClient";

interface ProductModalContextValue {
  openProduct: (productId: string) => void;
  closeProduct: () => void;
  activeProductId: string | null;
}

const ProductModalContext = createContext<ProductModalContextValue>({
  openProduct: () => {},
  closeProduct: () => {},
  activeProductId: null,
});

export function useProductModal() {
  return useContext(ProductModalContext);
}

export function ProductModalProvider({ children }: { children: ReactNode }) {
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const openProduct = useCallback((productId: string) => {
    setActiveProductId(productId);
    // Lock body scroll
    document.body.style.overflow = "hidden";
    // Update URL without full page reload
    if (typeof window !== "undefined") {
      window.history.pushState(
        { productModal: productId },
        "",
        `/products?id=${encodeURIComponent(productId)}`
      );
    }
  }, []);

  const closeProduct = useCallback(() => {
    setActiveProductId((prev) => {
      if (prev !== null) {
        document.body.style.overflow = "";
        // Clean URL if it has modal search param
        if (typeof window !== "undefined" && window.location.search.includes("id=")) {
          window.history.back();
        }
      }
      return null;
    });
  }, []);

  // Auto-close modal whenever user navigates to other pages (e.g. /checkout)
  useEffect(() => {
    if (pathname && pathname !== "/" && !pathname.startsWith("/products")) {
      if (activeProductId) {
        setActiveProductId(null);
        document.body.style.overflow = "";
      }
    }
  }, [pathname, activeProductId]);

  // Handle browser back/forward button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (!(e.state && e.state.productModal)) {
        setActiveProductId(null);
        document.body.style.overflow = "";
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Handle Escape key
  useEffect(() => {
    if (!activeProductId) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeProduct();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [activeProductId, closeProduct]);

  return (
    <ProductModalContext.Provider value={{ openProduct, closeProduct, activeProductId }}>
      {children}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {activeProductId && (
              <motion.div
                key={activeProductId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-[9999] bg-white dark:bg-zinc-950 overflow-y-auto"
              >
                <ProductDetailClient
                  overrideSlug={activeProductId}
                  onClose={closeProduct}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </ProductModalContext.Provider>
  );
}
