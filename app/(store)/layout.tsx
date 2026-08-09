import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { WishlistSidebar } from "@/components/wishlist/WishlistSidebar";
import { VisitorTracker } from "@/components/analytics/VisitorTracker";
import { MaintenanceGuard } from "@/components/layout/MaintenanceGuard";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MaintenanceGuard>
      <VisitorTracker />
      <Header />
      <CartSidebar />
      <WishlistSidebar />
      <main>{children}</main>
      <Footer />
    </MaintenanceGuard>
  );
}

