"use client";

import { useState, useEffect } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { IntroScreen } from "@/components/home/IntroScreen";
import type { Product } from "@/types/product";
import { getProducts } from "@/lib/firebase/firestore";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Load products
    getProducts()
      .then(setProducts)
      .catch((err) => {
        console.error("Failed to load products:", err);
      });
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
