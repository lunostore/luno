"use client";

import { useState, useEffect } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { IntroScreen } from "@/components/home/IntroScreen";
import type { Product } from "@/types/product";
import { subscribeToProducts } from "@/lib/firebase/firestore";

import { useScrollRestoration } from "@/hooks/useScrollRestoration";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useScrollRestoration();

  useEffect(() => {
    // Realtime products listener — updates instantly when any product is added/edited
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <IntroScreen />
      <HeroSection />
      <div id="products">
        <FeaturedProducts products={products} />
      </div>
    </>
  );
}
