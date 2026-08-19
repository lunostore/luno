import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/features/cart/CartProvider";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import { WishlistProvider } from "@/features/wishlist/WishlistProvider";
import { SiteSettingsProvider } from "@/features/settings/SiteSettingsProvider";
import { ErrorTrackerProvider } from "@/components/ui/ErrorTrackerProvider";
import { Toaster } from "sonner";


const gaId = process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-Y9G4D0TC9L";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunostore.shop"
  ),
  title: {
    default: "Luno Store | البراند المفضل للملابس العصرية",
    template: "%s | Luno Store",
  },
  description:
    "تسوق أحدث تشكيلات الملابس والستريت وير العصرية من براند Luno Store. اكتشف أفضل الهوديز، التيشيرتات، والبنطلونات المصممة بأعلى جودة وخامات ممتازة في مصر والوطن العربي.",
  keywords: [
    // 1. اسم البراند وتنويعاته (Brand Name Variations)
    "lunostore",
    "Luno Store",
    "Luno Streetwear",
    "Luno Clothing",
    "Luno Fashion",
    "Luno Brand",
    "براند لونو",
    "لونو ستور",
    "لونو",
    "متجر Luno Store",
    "براند ملابس Luno Store",

    // 2. ملابس + اسم البراند (Clothing + Brand)
    "ملابس Luno",
    "ملابس لونو",
    "براند ملابس لونو",
    "Luno streetwear",
    "هوديز Luno",
    "تيشيرتات Luno",
    "بنطلونات Luno",
    "سويت شيرت Luno",
    "Luno t-shirts",
    "Luno hoodies",
    "Luno pants",
    "Luno jackets",

    // 3. كلمات SEO موضة وستريت وير محلية وإقليمية (Local & Category SEO)
    "Luno Egypt",
    "Luno مصر",
    "براندات ستريت وير في مصر",
    "ملابس ستريت وير مصر",
    "Streetwear Egypt",
    "Fashion Brand Egypt",
    "ملابس شبابي عصرية",
    "أحدث صيحات الموضة Luno Store",
    "تسوق ملابس اونلاين مصر",
    "أونلاين شوبينج ملابس",
  ],
  authors: [{ name: "Luno Store Brand" }],
  creator: "Luno Store",
  publisher: "Luno Store",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/logo.png",
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  alternates: {
    canonical: "https://www.lunostore.shop",
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "https://www.lunostore.shop",
    siteName: "Luno Store - براند Luno للملابس",
    title: "Luno Store | البراند المفضل للملابس والستريت وير العصرية",
    description:
      "تسوق أحدث تشكيلات الملابس والستريت وير من براند Luno Store. خامات ممتازة وتصاميم عصرية تناسب أسلوب حياتك.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Luno Store Clothing Brand Logo",
      },
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "Luno Store Brand Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luno Store | البراند المفضل للملابس والستريت وير العصرية",
    description: "تسوق أحدث تشكيلات الملابس والستريت وير العصرية من براند Luno Store.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('luno-theme') || localStorage.getItem('nxt-theme');
                  var system = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && system)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <Script
          id="json-ld-brand"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Brand",
              "name": "Luno Store",
              "alternateName": ["لونو", "Luno", "Luno Store", "Luno Streetwear", "ملابس Luno", "براند Luno"],
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunostore.shop",
              "logo": "https://www.lunostore.shop/logo.png",
              "image": "https://www.lunostore.shop/logo.png",
              "description": "براند Luno Store المتخصص في أفضل ملابس الستريت وير والعصرية في مصر والوطن العربي."
            })
          }}
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground transition-colors duration-300">
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        <ErrorTrackerProvider>
          <SiteSettingsProvider>
            <AuthProvider>
              <ThemeProvider>
                <CartProvider>
                  <WishlistProvider>
                    {children}
                    <Toaster
                      position="bottom-right"
                      toastOptions={{
                        style: {
                          background: "#000",
                          color: "#fff",
                          borderRadius: "12px",
                          border: "none",
                        },
                      }}
                    />
                  </WishlistProvider>
                </CartProvider>
              </ThemeProvider>
            </AuthProvider>
          </SiteSettingsProvider>
        </ErrorTrackerProvider>

      </body>
    </html>
  );
}
