"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { Product } from "@/types/product";

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  isOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  toggleWishlistDrawer: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load wishlist from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("luno-wishlist") || localStorage.getItem("nxt-wishlist");
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load wishlist", e);
    }
  }, []);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      let next;
      if (exists) {
        next = prev.filter((item) => item.id !== product.id);
        toast.info(`تمت إزالة ${product.name} من المفضلة`);
      } else {
        next = [...prev, product];
        toast.success(`تمت إضافة ${product.name} إلى المفضلة! ❤️`);
      }
      try {
        localStorage.setItem("luno-wishlist", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save wishlist", e);
      }
      return next;
    });
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlist.some((item) => item.id === productId);
    },
    [wishlist]
  );

  const openWishlist = useCallback(() => setIsOpen(true), []);
  const closeWishlist = useCallback(() => setIsOpen(false), []);
  const toggleWishlistDrawer = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        isOpen,
        openWishlist,
        closeWishlist,
        toggleWishlistDrawer,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
