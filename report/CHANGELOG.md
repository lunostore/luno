# Luno Store — Changelog & Mod Log

This document lists all modifications, fixes, and improvements applied to the **Luno Store** codebase during this development session.

---

## 📅 September 2026

### 🎁 Dynamic Bundle Discounts, Smart Upsell Engine, Announcement Bar & System Hardening (14 Sep 2026)
* **Dynamic Bundle Discounts Engine**: Developed an automated tier-based discount system (`completedBundles * discountPerBundle`) with compounding discounts (buying 2 items saves 60 EGP, 4 items saves 120 EGP, 6 items saves 180 EGP).
* **Eastern Arabic Numerals Normalization**: Implemented `parseArabicNumber` helper handling Eastern Arabic numerals (`٠١٢٣٤٥٦٧٨٩`) in the admin settings dashboard, preventing `NaN` serialization failures when typing in Arabic.
* **Smart Upsell & Celebration Banners**:
  * Added top-mounted sticky notification in `CartSidebar.tsx` displaying the exact items needed to achieve the next discount threshold.
  * Added animated celebration green tag showing real-time savings once the threshold is met, with strikethrough original prices.
  * Added dynamic add-to-cart toast notifications in `ProductDetailClient.tsx` motivating shoppers to add one more piece to qualify.
* **High-Contrast Admin Offers & Announcement Hub**: Created a dedicated control center in `/admin/settings?tab=offers` with 1-click toggle switches (`مفعّل 🟢` / `متوقف ⚪`), live preview calculations, and custom banner copy inputs.
* **Hardware-Accelerated Announcement Marquee**: Integrated a smooth 60fps marquee announcement bar at the top of the storefront supporting instant Dark/Light mode switching with clean dot separators (`•`).
* **UI Minimalist Polish & Star Removal**: Eliminated `Sparkles` and star (`✦`) icons across the cart upsell button, headings, and order management views for a clean, editorial aesthetic.
* **Manifest 403 Console Error Elimination**: Removed `app/manifest.ts` to prevent browser `<link rel="manifest">` requests blocked by Vercel WAF/Firewall.
* **Webpack Chunk & Error Tracker Optimization**:
  * Removed `framer-motion` from `experimental.optimizePackageImports` in `next.config.ts` to eliminate `TypeError: e[o] is not a function`.
  * Filtered out external in-app browser noises (`Script error. :0:0`, Facebook/Instagram WebView errors) in `ErrorTrackerProvider.tsx`.
* **Full Order Pipeline Sync**: Connected bundle discounts to Firestore order documents, Excel report exports, printable PDF invoices, and WhatsApp order confirmation templates.

---

### 🎯 Ad Campaign Radar, Funnel Telemetry, Date Range Filtering & Vercel Build Optimization (09 Sep 2026)
* **Ad Campaign Radar & Attribution Tracking**: Built full-spectrum UTM tracking engine (`utm_campaign`, `utm_source`, `utm_medium`, `utm_content`) connecting external ads (TikTok, Instagram, Facebook, Snapchat, Google) directly to specific products, real click visits, and completed purchases.
* **Instant Campaign URL Builder Modal**: Interactive popup in `/admin/analytics` enabling admin to pick any store product, define campaign names, select advertising platforms with 1-click buttons, and instantly copy or preview the tracking URL.
* **Furthest Funnel Stage Recording (Non-Degrading State)**: Resolved checkout drop-off visibility. If a visitor reaches `/checkout` and later browses back to products or home, their highest achieved funnel stage remains permanently flagged as `Checkout 🛒💳` in Firestore and the live sessions table.
* **Checkout Abandonment Telemetry**: Dedicated analysis tab measuring checkout entries, completed orders, and abandoned sessions with drop rate percentages and immediate drill-down filtering.
* **Comprehensive Date Range Filter Engine**: Added calendar range selection (Start/End Date) plus quick presets (`All Time`, `Today`, `Yesterday`, `Last 7 Days`, `Last 30 Days`, `This Month`) recalculating visits, pageviews, and device metrics on the fly.
* **Responsive Daily Trend Chart Overhaul**: Fixed RTL horizontal overflow where chart bars spilled outside their card boundaries. Implemented `min-w-0`, `overflow-hidden`, smooth horizontal scroll area (`overflow-x-auto`), aesthetic 2-line Arabic date labels, and interactive amber hover states.
* **Admin Overview Quick Widgets**: Added top-level Ad Campaign and Checkout Abandonment indicator widgets on the primary `/admin` dashboard.
* **Vercel Build Zero-Error Compliance**:
  * Fixed JSX unescaped quote error (`react/no-unescaped-entities`) in `admin/analytics/page.tsx`.
  * Fixed `prefer-const` in `lib/firebase/firestore.ts`.
  * Fixed TypeScript return type mismatch in `VisitorTracker.tsx`.
  * Removed unused variables (`LayoutGrid`, `startTransition`) in `admin/products/page.tsx`.
  * Replaced `<img>` in chat widget with Next.js `<Image>` and sanitized all TypeScript `any` types.

---

## 📅 August 2026

### 🛍️ 3D Shopflex Product Card Replication & Mobile Performance (23 Aug 2026)
* **Pixel-Perfect Shopflex 3D Card**: Implemented high-rise floating pop-out (`translateY: -46px`, `scale: 1.18x`) with dynamic floor shadow, rising black shelf with convex dome arch SVG (`M 0,20 Q 50,0 100,20 L 100,100 L 0,100 Z`), and expanding bubble pill buttons.
* **100% Mobile & PC Geometry Unification**: Unified aspect ratio (`pb-[78%]`), image width (`w-[88%]`), padding (`px-4 pb-4 pt-7`), and button metrics (`w-11 h-11`) so admin scale/offset adjustments match 1:1 across all screens.
* **Custom Product Reordering System**: Built interactive Reorder Mode in Admin Products page with rank badges (`#1`, `#2`...), direct shift buttons (Top, Up, Down, Bottom), quick presets (Newest, High/Low Price, A-Z), and instant Firestore batch saving.
* **Realtime Storefront Sort Order Sync**: Implemented `sortProductsByCustomOrder` across `getProducts` and `subscribeToProducts` to automatically display products on the homepage and shop in the custom order.
* **Footer Links Restructuring & Mobile Centering**: Divided INFO links into two compact columns (Right & Left) and centered footer content on mobile.
* **Instant Cross-Fade & Fly-to-Cart Animation**: Smooth cross-fade between main image and hover image; animated clone flying to cart on button click.
* **Admin Live Preview Replica**: Replaced generic admin preview with an exact interactive replica reflecting live field changes, scale/offset sliders, and hover effects.
* **Checkout Store Navigation Button**: Added a dedicated "رجوع للمتجر" (Back to Store) exit button in the checkout header.
* **Hardware-Accelerated Mobile Responsiveness**: Converted transitions to 250-300ms GPU-accelerated transforms with radial gradient floor shadows for 60/120Hz smooth touch interactions.
* **Vercel Build Zero-Error Fixes**: Resolved `onlineNumberDisplay` and `isFormValid` typing references and cleaned up all unused React imports.

### 🎬 Intro Screen Curtain Slide-Up Animation
* **Curtain Reveal Motion**: Upgraded intro exit transition to a fluid vertical curtain lift (`y: "-100%"`) with a luxury ease curve `[0.76, 0, 0.24, 1]` across `LUNOCleanIntro.tsx`, `NXTCleanIntro.tsx`, `IntroAppleMinimal.tsx`, and `LUNOIntro.tsx`.
* **Parallax Interior Element Fade**: Added subtle parallax upward glide to the LUNO typography during the lift.
* **Synchronized Lifecycle**: Hooked `onComplete` to `AnimatePresence (onExitComplete)` to ensure seamless storefront presentation.

### 📦 3D Product Card & Floating Motion
* **Dome Arc & Spring Hover**: Re-engineered card bottom shelf and arc to match the reference convex curve with spring hover motion and full dark/light theme awareness.
* **Unclipped Collar & Oversized Display**: Removed container clipping and increased image coverage to 92% of the card area.

### 🎛️ Admin Image Scale & Offset Controls
* Added real-time sliders for image scaling (70% - 150%) and vertical offset (-50px to +50px) with live mini preview in `ProductForm.tsx`.

### ⚡ Client-Side WebP Compression & Cloudinary Direct Upload
* Prevented Firestore 1MB document size limit issues by auto-compressing uploaded images to lightweight WebP (50KB-80KB).
* Bypassed browser CORS restrictions via server route `/api/upload`.

### ⭐ Dedicated Customer Reviews Route
* Extracted reviews into a standalone page at `app/(store)/reviews/page.tsx` and cleaned up the homepage.

### 🛍️ Direct Checkout Flow & Geometry Enhancements
* Centered the LUNO brand logo in the product modal and streamlined direct checkout.
* Expanded the wishlist button hitbox to 44x44px with event isolation and interactive toasts.

---

## 📅 July 2026

### 🛠️ Vercel Build Optimization & Prerender Fixes
* **Firebase Admin Prerender Guard**: Refactored `lib/firebase/admin.ts` to export lazy-loaded getters for `adminAuth` and `adminDb` instead of instant exports. This stopped Vercel builds from crashing due to missing private Firebase keys on the build server.
* **Suspense Boundaries**: Wrapped the `ShopPage` search filters and `OrderSuccess` order verification in client-side `<Suspense>` blocks. This fixed Next.js static page generation bailout warnings (`useSearchParams()` must be wrapped in Suspense).
* **Safe Redirect Wrapper**: Wrapped raw window redirection inside `app/(store)/checkout/page.tsx` in a `useEffect` hook to prevent "location is not defined" ReferenceErrors on pre-compilation.

### 🌗 Light / Dark Mode Implementation
* **ThemeProvider Hook**: Created `features/theme/ThemeProvider.tsx` to handle dynamic `.dark` class toggling on the root element.
* **globals.css Variables**: Defined HSL tokens for background, foreground, border, and card shades, ensuring they swap colors automatically in dark mode.
* **Contrast Adjustments**:
  * Added `dark:bg-zinc-900/40 rounded-3xl` and `dark:mix-blend-normal` to `ProductCard.tsx` image render blocks. This ensures white-background product JPGs look beautiful and float on dark layouts without disappearing.
  * Updated `Header.tsx` so scrolled states transition to translucent black (`bg-black/95`) in dark mode with white text, preventing black text on black background rendering issues.
  * Injected blocking script in `app/layout.tsx` to eliminate initial light flashes in dark mode.

### 🌀 3D Logo & Branding
* **Asset Automation**: Updated `push_to_github.bat` and `push_to_github.sh` to automatically copy logo assets (`12-removebg-preview.png` and banners) from Desktop into the `/public` workspace folder.
* **3D Extrusion Component**: Built `<Logo3D />` that stacks 15 transparent PNG layers with Z-axis offset to form a physical 3D rotated logo.
* **Header/Footer Graphics**: Swapped out plain text "LUNO" for the brand logo `/logo.png`, incorporating a dynamic `invert` filter to remain white on dark backgrounds and black on light backgrounds.

### 📐 SPA Catalog Restructuring
* **Scroll Action**: Modified the Hero "Shop Now" scroll button to smoothly glide down to the products list instead of redirecting pages.
* **Catalog Merge**: Loaded all products on the main home page under "Our Collection".
* **Shop Route Deprecation**: Swapped the old `/shop` route in `app/(store)/shop/page.tsx` for a clean client-side router fallback that immediately redirects back to `/#products`.
* **Footer simplification**: Cleaned up deprecated links in the footer, showing only active routes (Home, Shop, About, Contact).

---

## 🔒 Configuration Credentials
Set default fallback configuration values to the active Firebase project:
* **Admin Email**: `lunoegypt@gmail.com`

