"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { WishlistSidebar } from "@/components/wishlist/WishlistSidebar";
import { VisitorTracker } from "@/components/analytics/VisitorTracker";
import { MaintenanceGuard } from "@/components/layout/MaintenanceGuard";
import { ProductModalProvider } from "@/features/product-modal/ProductModalProvider";
import { LUNOChatWidget } from "@/components/chat/LUNOChatWidget";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MaintenanceGuard>
      <ProductModalProvider>
        <VisitorTracker />
        <Header />
        <CartSidebar />
        <WishlistSidebar />
        <main>{children}</main>
        <Footer />
        <LUNOChatWidget />
      </ProductModalProvider>
    </MaintenanceGuard>
  );
}
