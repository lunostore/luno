# Luno Store — Changelog & Mod Log

This document lists all modifications, fixes, and improvements applied to the **Luno Store** codebase during this development session.

---

## 📅 August 2026

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

