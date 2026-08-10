import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  increment,
  serverTimestamp,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";
import type { Product } from "@/types/product";
import type { Order, OrderStatus, CreateOrderInput } from "@/types/order";
import type { Category } from "@/types/category";
import { deleteFromCloudinary } from "../cloudinary";

// ─── Helpers ──────────────────────────────────────────────

export function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (
    obj instanceof Date ||
    typeof (obj as any).toMillis === "function" ||
    typeof (obj as any).isEqual === "function"
  ) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj as Record<string, any>)) {
    const val = (obj as Record<string, any>)[key];
    if (val !== undefined) {
      cleaned[key] = cleanUndefined(val);
    }
  }
  return cleaned as T;
}

// ─── Products ──────────────────────────────────────────

export async function getProducts(filters?: {
  featured?: boolean;
  bestSeller?: boolean;
  category?: string;
  limitCount?: number;
}): Promise<Product[]> {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

  if (filters?.featured) constraints.push(where("featured", "==", true));
  if (filters?.bestSeller) constraints.push(where("bestSeller", "==", true));
  if (filters?.category) constraints.push(where("category", "==", filters.category));
  if (filters?.limitCount) constraints.push(limit(filters.limitCount));

  const q = query(collection(db, "products"), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product);
}

export function subscribeToProducts(
  callback: (products: Product[]) => void,
  filters?: {
    featured?: boolean;
    bestSeller?: boolean;
    category?: string;
    limitCount?: number;
  }
): () => void {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

  if (filters?.featured) constraints.push(where("featured", "==", true));
  if (filters?.bestSeller) constraints.push(where("bestSeller", "==", true));
  if (filters?.category) constraints.push(where("category", "==", filters.category));
  if (filters?.limitCount) constraints.push(limit(filters.limitCount));

  const q = query(collection(db, "products"), ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product);
      callback(products);
    },
    (error) => {
      console.error("Realtime products subscription error:", error);
    }
  );
}

export async function getProductBySlug(slugParam: string): Promise<Product | null> {
  if (!slugParam) return null;

  try {
    const decodedParam = decodeURIComponent(slugParam).trim().toLowerCase();

    // 1. Try fetching directly by document ID first
    const byId = await getProductById(slugParam);
    if (byId) return byId;

    // 2. Try matching by full slug field
    const q1 = query(collection(db, "products"), where("slug", "==", slugParam), limit(1));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const d = snap1.docs[0];
      return { id: d.id, ...d.data() } as Product;
    }

    // 3. Try clean slug without SKU suffix
    const skuPattern = /-(luno|nxt)-[a-z0-9]{4}$/i;
    const cleanSlug = slugParam.replace(skuPattern, "");
    if (cleanSlug !== slugParam) {
      const q2 = query(collection(db, "products"), where("slug", "==", cleanSlug), limit(1));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        const d = snap2.docs[0];
        return { id: d.id, ...d.data() } as Product;
      }
    }

    // 4. Fallback: Fetch all products and match strictly by ID, slug, or SKU
    const allProducts = await getProducts();
    if (allProducts.length === 0) return null;

    // First try strict exact match
    const exactMatched = allProducts.find((p) => {
      const pId = (p.id || "").toLowerCase();
      const pSlug = (p.slug || "").toLowerCase();
      const pSku = (p.sku || "").toLowerCase();
      return (
        pId === decodedParam ||
        pSlug === decodedParam ||
        pSku === decodedParam
      );
    });
    if (exactMatched) return exactMatched;

    // Second try name exact match
    const nameMatched = allProducts.find(
      (p) => (p.name || "").toLowerCase().trim() === decodedParam
    );
    if (nameMatched) return nameMatched;

    // Third try partial slug or name match
    const partialMatched = allProducts.find((p) => {
      const pSlug = (p.slug || "").toLowerCase();
      const pName = (p.name || "").toLowerCase();
      return pSlug.includes(decodedParam) || pName.includes(decodedParam);
    });
    if (partialMatched) return partialMatched;
  } catch (err) {
    console.error("Error fetching product by slug/id:", err);
  }

  return null;
}


export async function getProductById(id: string): Promise<Product | null> {
  const docRef = doc(db, "products", id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Product;
}

export async function createProduct(
  data: Omit<Product, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, "products"), cleanUndefined({
    ...data,
    createdAt: Timestamp.now(),
  }));
  return docRef.id;
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "products", id), cleanUndefined(data));
}

export async function deleteProduct(id: string): Promise<void> {
  // Fetch product to collect image URLs before deletion
  try {
    const product = await getProductById(id);
    if (product) {
      const allImages = [
        product.mainImage,
        ...(product.variants?.map((v) => v.image) || []),
      ].filter(Boolean) as string[];

      if (allImages.length > 0) {
        deleteFromCloudinary(allImages).catch(console.error);
      }
    }
  } catch (err) {
    console.error("Error collecting product images for Cloudinary deletion:", err);
  }

  await deleteDoc(doc(db, "products", id));
}

// ─── Orders ─────────────────────────────────────────────

export async function createOrder(data: CreateOrderInput): Promise<string> {
  const docRef = await addDoc(collection(db, "orders"), cleanUndefined({
    ...data,
    customerPhone: data.phone,
    status: "pending" as OrderStatus,
    createdAt: Timestamp.now(),
  }));
  return docRef.id;
}

export async function getOrders(statusFilter?: OrderStatus): Promise<Order[]> {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (statusFilter) constraints.push(where("status", "==", statusFilter));

  const q = query(collection(db, "orders"), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const docRef = doc(db, "orders", id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  await updateDoc(doc(db, "orders", id), { status });
}

export async function deleteOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, "orders", id));
}

// ─── Categories ──────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const q = query(collection(db, "categories"), orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Category);
}

export async function createCategory(
  data: Omit<Category, "id">
): Promise<string> {
  const docRef = await addDoc(collection(db, "categories"), cleanUndefined(data));
  return docRef.id;
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, "categories", id));
}

// ─── Site Settings (CMS) ─────────────────────────────────

export interface SiteSettings {
  storeName?: string;
  heroTagline?: string;
  heroButtonText?: string;
  heroMediaType?: "image" | "video";
  heroVideoUrlLight?: string;
  heroVideoUrlDark?: string;
  heroImagesLight?: string[];
  heroImagesDark?: string[];
  featuredTitle?: string;
  featuredSubtitle?: string;
  introTagline?: string;
  introImages?: string[];
  footerDescription?: string;
  storeEmail?: string;
  storePhone?: string;
  vodafoneCash?: string;
  instapayUsername?: string;
  onlinePaymentEnabled?: boolean;  // تفعيل/إيقاف الدفع الأونلاين
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  currency?: string;

  // About Page CMS
  aboutTitle?: string;
  aboutSubtitle?: string;
  aboutSection1Title?: string;
  aboutSection1Text?: string;
  aboutSection1Image?: string;
  aboutSection2Title?: string;
  aboutSection2Text?: string;
  aboutSection2Image?: string;

  // Legal & Privacy CMS
  privacyPolicyText?: string;
  termsOfServiceText?: string;

  // Maintenance & Restock System
  maintenanceEnabled?: boolean;
  maintenanceTitle?: string;
  maintenanceReason?: string;
  maintenanceEndTime?: string; // ISO String (e.g. 2026-08-09T21:00:00.000Z)
  maintenancePin?: string; // Secret PIN to bypass maintenance mode (e.g. "1234")
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const docRef = doc(db, "site_settings", "general");
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return snapshot.data() as SiteSettings;
  } catch (err) {
    console.error("Failed to fetch site settings:", err);
    return null;
  }
}

/** Real-time subscription to site settings. Calls callback immediately and on every update (< 1s) */
export function subscribeSiteSettings(
  callback: (settings: SiteSettings | null) => void
): () => void {
  const docRef = doc(db, "site_settings", "general");
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as SiteSettings);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.error("Failed to subscribe to site settings:", err);
      callback(null);
    }
  );
}

export async function updateSiteSettings(
  data: Partial<SiteSettings>
): Promise<void> {
  const docRef = doc(db, "site_settings", "general");
  await setDoc(docRef, cleanUndefined(data), { merge: true });
}


// ─── Shipping Rates (Governorates) ──────────────────────

import { DEFAULT_EGYPT_GOVERNORATES, type GovernorateRate } from "@/constants/governorates";

export async function getShippingRates(): Promise<GovernorateRate[]> {
  try {
    const docRef = doc(db, "site_settings", "shipping");
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return DEFAULT_EGYPT_GOVERNORATES;
    const data = snapshot.data();
    if (data?.rates && Array.isArray(data.rates)) {
      return data.rates as GovernorateRate[];
    }
    return DEFAULT_EGYPT_GOVERNORATES;
  } catch (err) {
    console.error("Failed to fetch shipping rates:", err);
    return DEFAULT_EGYPT_GOVERNORATES;
  }
}

export async function updateShippingRates(rates: GovernorateRate[]): Promise<void> {
  const docRef = doc(db, "site_settings", "shipping");
  await setDoc(docRef, cleanUndefined({ rates, updatedAt: Timestamp.now() }), { merge: true });
}

// ─── Contact Messages & Complaints ──────────────────────

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "unread" | "read";
  createdAt: any;
}

export async function createContactMessage(data: {
  name: string;
  email: string;
  message: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, "contact_messages"), cleanUndefined({
    ...data,
    status: "unread",
    createdAt: Timestamp.now(),
  }));
  return docRef.id;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  try {
    const q = query(collection(db, "contact_messages"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ContactMessage);
  } catch (err) {
    console.error("Failed to load contact messages:", err);
    return [];
  }
}

export async function updateContactMessageStatus(
  id: string,
  status: "unread" | "read"
): Promise<void> {
  await updateDoc(doc(db, "contact_messages", id), { status });
}

export async function deleteContactMessage(id: string): Promise<void> {
  await deleteDoc(doc(db, "contact_messages", id));
}

// ─── System Error Logs ─────────────────────────────────

export interface SystemErrorLog {
  id: string;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  context?: string;
  resolved: boolean;
  createdAt: any;
}

export async function createSystemErrorLog(data: {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  context?: string;
}): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "system_errors"), cleanUndefined({
      message: data.message || "Unknown Runtime Error",
      stack: data.stack || "",
      url: data.url || (typeof window !== "undefined" ? window.location.href : ""),
      userAgent: data.userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : ""),
      context: data.context || "Client Runtime",
      resolved: false,
      createdAt: Timestamp.now(),
    }));
    return docRef.id;
  } catch (err) {
    console.error("Failed to log system error to Firestore:", err);
    return "";
  }
}

export async function getSystemErrorLogs(): Promise<SystemErrorLog[]> {
  try {
    const q = query(collection(db, "system_errors"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as SystemErrorLog);
  } catch (err) {
    console.error("Failed to fetch system errors:", err);
    return [];
  }
}

export async function updateSystemErrorStatus(
  id: string,
  resolved: boolean
): Promise<void> {
  await updateDoc(doc(db, "system_errors", id), { resolved });
}

export async function deleteSystemErrorLog(id: string): Promise<void> {
  await deleteDoc(doc(db, "system_errors", id));
}

export async function clearAllSystemErrors(): Promise<void> {
  const snapshot = await getDocs(collection(db, "system_errors"));
  const deletePromises = snapshot.docs.map((docItem) => deleteDoc(docItem.ref));
  await Promise.all(deletePromises);
}

// ─── 8. تحليلات وزوار الموقع (Visitor Analytics) ──────────────────

export interface VisitorSession {
  id: string;
  sessionId: string;
  visitorId: string;
  createdAt: any;
  lastActive: any;
  dateKey: string;
  currentPage: string;
  device: "Mobile" | "Desktop" | "Tablet";
  browser: string;
  pageViews: number;
}

export interface VisitorAnalyticsSummary {
  liveCount: number;
  todayCount: number;
  totalVisitors: number;
  totalPageViews: number;
  sessions: VisitorSession[];
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  browserBreakdown: Record<string, number>;
  topPages: { path: string; count: number }[];
  dailyTrend: { date: string; label: string; count: number }[];
}

export async function trackVisitorSession(data: {
  sessionId: string;
  visitorId: string;
  currentPage: string;
  device: "Mobile" | "Desktop" | "Tablet";
  browser: string;
  isNewPageView?: boolean;
}): Promise<void> {
  if (!data.sessionId) return;
  try {
    const sessionRef = doc(db, "visitor_sessions", data.sessionId);
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);

    const sessionPayload: Record<string, any> = {
      sessionId: data.sessionId,
      visitorId: data.visitorId,
      lastActive: serverTimestamp(),
      dateKey,
      currentPage: data.currentPage || "/",
      device: data.device || "Desktop",
      browser: data.browser || "Unknown",
    };

    if (data.isNewPageView) {
      sessionPayload.pageViews = increment(1);
    }

    // Atomic write using setDoc with merge: true
    // Does NOT require getDoc read permissions, so unauthenticated visitors are tracked 100% reliably!
    await setDoc(sessionRef, sessionPayload, { merge: true });
  } catch (err) {
    console.error("Error tracking visitor session:", err);
  }
}

export function subscribeToVisitorSessions(
  callback: (summary: VisitorAnalyticsSummary) => void
): () => void {
  // Query without Firestore orderBy to avoid missing field drop or index constraints
  const q = query(collection(db, "visitor_sessions"), limit(200));

  return onSnapshot(
    q,
    (snapshot) => {
      const nowMs = Date.now();
      const liveWindowMs = 5 * 60 * 1000; // 5 minutes active window
      const todayStr = new Date().toISOString().slice(0, 10);

      const getMs = (t: any): number => {
        if (!t) return 0;
        if (t?.toMillis) return t.toMillis();
        if (t?.seconds) return t.seconds * 1000;
        if (t instanceof Date) return t.getTime();
        return 0;
      };

      const sessions: VisitorSession[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          sessionId: data.sessionId || docSnap.id,
          visitorId: data.visitorId || "Unknown",
          createdAt: data.createdAt,
          lastActive: data.lastActive,
          dateKey: data.dateKey || todayStr,
          currentPage: data.currentPage || "/",
          device: data.device || "Desktop",
          browser: data.browser || "Unknown",
          pageViews: data.pageViews || 1,
        };
      });

      // Sort in JS memory by lastActive descending
      sessions.sort((a, b) => getMs(b.lastActive) - getMs(a.lastActive));

      let liveCount = 0;
      let todayCount = 0;
      let totalPageViews = 0;
      const deviceCount = { mobile: 0, desktop: 0, tablet: 0 };
      const browserCount: Record<string, number> = {};
      const pageCountMap: Record<string, number> = {};
      const dailyCountMap: Record<string, number> = {};

      // Initialize past 7 days in daily map
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        dailyCountMap[k] = 0;
      }

      sessions.forEach((s) => {
        const lastActiveMs = getMs(s.lastActive);

        // Live status check (within last 5 mins)
        if (nowMs - lastActiveMs <= liveWindowMs && lastActiveMs > 0) {
          liveCount++;
        }

        // Today's visitor check
        if (s.dateKey === todayStr) {
          todayCount++;
        }

        totalPageViews += s.pageViews || 1;

        // Device breakdown
        const devKey = (s.device || "Desktop").toLowerCase();
        if (devKey.includes("mobile")) deviceCount.mobile++;
        else if (devKey.includes("tablet")) deviceCount.tablet++;
        else deviceCount.desktop++;

        // Browser breakdown
        const bName = s.browser || "أخرى";
        browserCount[bName] = (browserCount[bName] || 0) + 1;

        // Top pages
        const path = s.currentPage || "/";
        pageCountMap[path] = (pageCountMap[path] || 0) + 1;

        // Daily trend
        if (dailyCountMap[s.dateKey] !== undefined) {
          dailyCountMap[s.dateKey]++;
        } else {
          dailyCountMap[s.dateKey] = 1;
        }
      });

      const topPages = Object.entries(pageCountMap)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const dailyTrend = Object.entries(dailyCountMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => {
          const dObj = new Date(date);
          const label = isNaN(dObj.getTime())
            ? date
            : dObj.toLocaleDateString("ar-EG", { weekday: "short", day: "numeric", month: "numeric" });
          return { date, label, count };
        });

      callback({
        liveCount,
        todayCount,
        totalVisitors: sessions.length,
        totalPageViews,
        sessions,
        deviceBreakdown: deviceCount,
        browserBreakdown: browserCount,
        topPages,
        dailyTrend,
      });
    },
    (err) => {
      console.error("Error subscribing to visitor sessions:", err);
      // Invoke callback with safe default fallback so page stops loading state
      callback({
        liveCount: 0,
        todayCount: 0,
        totalVisitors: 0,
        totalPageViews: 0,
        sessions: [],
        deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
        browserBreakdown: {},
        topPages: [],
        dailyTrend: [],
      });
    }
  );
}

// ─── AI Chatbot Analytics & Conversion Tracking ──────────

export interface ChatEvent {
  id?: string;
  type: "chat_started" | "product_recommended" | "add_to_cart_click" | "chat_sale";
  productId?: string;
  productName?: string;
  selectedColor?: string;
  selectedSize?: string;
  sessionId?: string;
  price?: number;
  timestamp: any;
}

export interface ChatAnalyticsSummary {
  totalConversations: number;
  totalRecommendations: number;
  totalCartAdds: number;
  conversionRate: number;
  estimatedRevenue: number;
  events: ChatEvent[];
  topProducts: { productId: string; name: string; count: number }[];
}

export async function logChatEvent(
  type: ChatEvent["type"],
  data?: Partial<Omit<ChatEvent, "type" | "timestamp">>
): Promise<void> {
  try {
    const sessionStorageKey = "luno_chat_session_id";
    let sessionId = typeof window !== "undefined" ? sessionStorage.getItem(sessionStorageKey) : null;
    if (!sessionId && typeof window !== "undefined") {
      sessionId = `chat_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem(sessionStorageKey, sessionId);
    }

    await addDoc(collection(db, "chat_events"), cleanUndefined({
      type,
      sessionId: sessionId || "unknown",
      productId: data?.productId || null,
      productName: data?.productName || null,
      selectedColor: data?.selectedColor || null,
      selectedSize: data?.selectedSize || null,
      price: data?.price || 0,
      timestamp: serverTimestamp(),
    }));
  } catch (err) {
    console.error("Failed to log chat event:", err);
  }
}

export function subscribeChatAnalytics(
  callback: (summary: ChatAnalyticsSummary) => void
): () => void {
  const q = query(collection(db, "chat_events"), orderBy("timestamp", "desc"), limit(200));

  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatEvent[];

      const sessionsSet = new Set<string>();
      let recommendationsCount = 0;
      let cartAddsCount = 0;
      let estimatedRevenue = 0;
      const productCountMap: Record<string, { name: string; count: number }> = {};

      events.forEach((ev) => {
        if (ev.sessionId) sessionsSet.add(ev.sessionId);
        if (ev.type === "product_recommended") recommendationsCount++;
        if (ev.type === "add_to_cart_click") {
          cartAddsCount++;
          if (ev.price) estimatedRevenue += ev.price;
          if (ev.productId) {
            const pId = ev.productId;
            const pName = ev.productName || "منتج غير معنون";
            if (!productCountMap[pId]) {
              productCountMap[pId] = { name: pName, count: 0 };
            }
            productCountMap[pId].count++;
          }
        }
      });

      const totalConversations = sessionsSet.size;
      const conversionRate = totalConversations > 0 ? (cartAddsCount / totalConversations) * 100 : 0;
      const topProducts = Object.entries(productCountMap)
        .map(([productId, { name, count }]) => ({ productId, name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      callback({
        totalConversations,
        totalRecommendations: recommendationsCount,
        totalCartAdds: cartAddsCount,
        conversionRate: Math.round(conversionRate * 10) / 10,
        estimatedRevenue,
        events,
        topProducts,
      });
    },
    (err) => {
      console.error("Error subscribing to chat analytics:", err);
      callback({
        totalConversations: 0,
        totalRecommendations: 0,
        totalCartAdds: 0,
        conversionRate: 0,
        estimatedRevenue: 0,
        events: [],
        topProducts: [],
      });
    }
  );
}


