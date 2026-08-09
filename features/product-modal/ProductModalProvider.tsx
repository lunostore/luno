"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const openProduct = useCallback((productId: string) => {
    setActiveProductId(productId);
    // Lock body scroll
    document.body.style.overflow = "hidden";
    // Update URL without navigation (shallow)
    window.history.pushState(
      { productModal: productId },
      "",
      `/products?id=${encodeURIComponent(productId)}`
    );
  }, []);

  const closeProduct = useCallback(() => {
    setActiveProductId((prev) => {
      if (prev !== null) {
        // Restore body scroll
        document.body.style.overflow = "";
        // Go back in history to restore the original URL
        window.history.back();
      }
      return null;
    });
  }, []);

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
