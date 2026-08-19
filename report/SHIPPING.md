# 🚚 توثيق نظام الشحن الكامل — Luno Store

> **آخر تحديث**: أغسطس 2026
> **المشروع**: Luno Store — متجر أزياء إلكتروني (Next.js 15 + Firebase)
> **شركة الشحن**: بريد مصر — وصّلها (`wassalha.egyptpost.org`)

---

## 📑 فهرس المحتويات

1. [نظرة عامة](#-نظرة-عامة)
2. [هيكل الملفات المتعلقة بالشحن](#-هيكل-الملفات-المتعلقة-بالشحن)
3. [دورة حياة الطلب والشحن](#-دورة-حياة-الطلب-والشحن)
4. [أنواع البيانات (TypeScript Types)](#-أنواع-البيانات-typescript-types)
5. [أسعار الشحن — 27 محافظة مصرية](#-أسعار-الشحن--27-محافظة-مصرية)
6. [صفحة الـ Checkout — حساب تكلفة الشحن](#-صفحة-الـ-checkout--حساب-تكلفة-الشحن)
7. [لوحة التحكم — إدارة الشحن (Admin)](#-لوحة-التحكم--إدارة-الشحن-admin)
8. [بوت أتمتة الشحن (Python + Playwright)](#-بوت-أتمتة-الشحن-python--playwright)
9. [Firestore Data Model](#-firestore-data-model)
10. [إشعارات Telegram](#-إشعارات-telegram)
11. [رسالة تأكيد الطلب (WhatsApp)](#-رسالة-تأكيد-الطلب-whatsapp)
12. [سياسة الشحن والاسترجاع](#-سياسة-الشحن-والاسترجاع)
13. [نظام المخزون والشحن](#-نظام-المخزون-والشحن)
14. [التحسينات المستقبلية](#-التحسينات-المستقبلية)

---

## 🌐 نظرة عامة

نظام الشحن في Luno Store مبني على عدة طبقات متكاملة:

**الفكرة الأساسية:**
1. العميل يطلب من المتجر → يختار محافظته → تكلفة الشحن تُحسب تلقائي
2. الأدمن يأكد الطلب → المخزون ينخصم تلقائي
3. بوت الأتمتة يسجل الشحنة على وصّلها → يجيب رقم التتبع
4. رقم التتبع يُحفظ في Firestore → إشعار Telegram يتبعت

### المكونات الرئيسية

```
🛒 العميل (Checkout) → 💾 Firestore (orders) → 📋 لوحة التحكم (Admin)
                                                        ↓
                                                  تأكيد الطلب
                                                        ↓
                                              🤖 بوت الشحن (Python)
                                                        ↓
                                              📦 وصّلها (بريد مصر)
                                                        ↓
                                              رقم التتبع → Firestore
                                                        ↓
                                              📱 إشعار Telegram
```

---

## 📁 هيكل الملفات المتعلقة بالشحن

### الكود الأساسي (Next.js / TypeScript)

| الملف | الوظيفة |
|---|---|
| `types/order.ts` | تعريف أنواع الطلب + حقول الشحن + labels |
| `constants/governorates.ts` | أسعار 27 محافظة + مصفوفة الشحن Origin→Destination |
| `constants/policies.ts` | نص سياسة الشحن والاسترجاع |
| `lib/firebase/firestore.ts` | كل دوال Firestore المتعلقة بالشحن |
| `lib/validations/checkout.schema.ts` | Zod schema لتحقق بيانات الشحن |
| `lib/utils.ts` | دالة بناء رسالة WhatsApp (تشمل الشحن) |
| `lib/export-orders.ts` | طباعة بوالص الشحن PDF |

### صفحات المتجر

| الملف | الوظيفة |
|---|---|
| `app/(store)/checkout/page.tsx` | صفحة إتمام الطلب + اختيار المحافظة + حساب الشحن |
| `app/(store)/order-success/` | صفحة نجاح الطلب |
| `components/checkout/TruckSubmitButton.tsx` | زرار التأكيد (أنيميشن شاحنة) |

### لوحة التحكم (Admin)

| الملف | الوظيفة |
|---|---|
| `app/(admin)/admin/orders/page.tsx` | إدارة الطلبات + إدخال رقم التتبع يدوي + نسخ بيانات الشحن |
| `app/(admin)/admin/shipping/page.tsx` | إدارة أسعار الشحن لكل محافظة |

### بوت الأتمتة (Python)

| الملف | الوظيفة |
|---|---|
| `automation/main.py` | نقطة الدخول — CLI (single / batch / watch) |
| `automation/shipping_bot.py` | محرك Playwright — login, fill form, submit, extract tracking |
| `automation/firebase_client.py` | اتصال Firebase Admin SDK — قراءة/تحديث الطلبات |
| `automation/governorate_mapping.py` | ربط أسماء المحافظات العربية بقيم dropdown وصّلها |
| `automation/config.py` | قراءة `.env` — credentials + options |
| `automation/logger.py` | Logger بسيط — console + file |
| `automation/.env` | بيانات الاعتماد (لا يُرفع على Git) |
| `automation/service-account.json` | Firebase Admin SDK key (لا يُرفع على Git) |

---

## 🔄 دورة حياة الطلب والشحن

### تسلسل الحالات

```
[العميل يطلب] → pending → confirmed → shipping → delivered
                    ↓           ↓          ↓
                cancelled    cancelled   cancelled
```

### تفاصيل كل حالة

| الحالة | الاسم بالعربي | اللون | ماذا يحدث |
|---|---|---|---|
| `pending` | في الانتظار | 🟡 أصفر | الطلب وصل — مستني تأكيد الأدمن |
| `confirmed` | مؤكد | 🔵 أزرق | الأدمن أكد → **المخزون انخصم تلقائي** → جاهز للشحن |
| `shipping` | جارٍ الشحن | 🟣 بنفسجي | تم تسجيل الشحنة ← فيه رقم تتبع |
| `delivered` | تم التسليم | 🟢 أخضر | العميل استلم |
| `cancelled` | ملغي | 🔴 أحمر | تم الإلغاء ← **المخزون يرجع تلقائي** (لو كان انخصم) |

### تسلسل الحالات المسموح

```
pending    → confirmed | cancelled
confirmed  → shipping  | cancelled
shipping   → delivered | cancelled
delivered  → (لا يوجد)
cancelled  → (لا يوجد)
```

---

## 📐 أنواع البيانات (TypeScript Types)

### OrderStatus
```typescript
type OrderStatus = "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
```

### PaymentMethod
```typescript
type PaymentMethod = "cash_on_delivery" | "vodafone_cash" | "instapay";
```

### Order — الطلب الكامل
```typescript
interface Order {
  id: string;
  customerName: string;
  phone: string;
  secondaryPhone: string;        // رقم الهاتف الثاني (إجباري)
  customerPhone?: string;
  whatsappPhone?: string;
  governorate?: string;          // اسم المحافظة بالعربي
  city: string;                  // المنطقة / الحي
  address: string;               // العنوان بالتفصيل
  notes?: string;
  paymentMethod: PaymentMethod;
  transferPhone?: string;        // رقم اللي حوّل منه (للدفع الأونلاين)
  transferScreenshot?: string;   // Cloudinary URL لصورة إيصال التحويل
  items: OrderItem[];
  subtotal: number;              // مجموع المنتجات بدون شحن
  shippingCost?: number;         // تكلفة الشحن حسب المحافظة
  total: number;                 // subtotal + shippingCost
  status: OrderStatus;
  createdAt: Timestamp | Date;

  // ─── حقول الشحن التلقائي ─────────
  trackingNumber?: string;       // رقم البوليصة من شركة الشحن
  shippingProvider?: string;     // "egypt_post" | "manual"
  shippedAt?: Timestamp | Date;  // وقت تسجيل الشحنة
  shippingError?: string;        // رسالة خطأ لو فشل التسجيل
  shippingLabelUrl?: string;     // رابط PDF البوليصة
}
```

### OrderItem — عنصر واحد في الطلب
```typescript
interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  selectedSize: string;
  selectedColor: {
    name: string;
    hex: string;
    image: string;
  };
}
```

### GovernorateRate — سعر شحن المحافظة
```typescript
interface GovernorateRate {
  id: string;              // مثال: "cairo"
  nameAr: string;          // "القاهرة"
  nameEn: string;          // "Cairo"
  price: number;           // سعر الشحن الأساسي (أول 1 كجم)
  active: boolean;         // مفعّل أم لا
  additionalKgPrice?: number; // سعر كل كيلو إضافي (افتراضي: 7 ج.م)
}
```

### CreateOrderInput — بيانات إنشاء الطلب
```typescript
interface CreateOrderInput {
  customerName: string;
  phone: string;
  secondaryPhone: string;
  whatsappPhone?: string;
  governorate?: string;
  city: string;
  address: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  transferPhone?: string;
  transferScreenshot?: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost?: number;
  total: number;
}
```

### Labels والألوان
```typescript
const ORDER_STATUS_LABELS = {
  pending: "في الانتظار",
  confirmed: "مؤكد",
  shipping: "جارٍ الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const ORDER_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipping: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_METHOD_LABELS = {
  cash_on_delivery: "🚪 الدفع عند الاستلام",
  vodafone_cash: "📱 فودافون كاش",
  instapay: "💳 انستاباي",
};
```

---

## 💰 أسعار الشحن — 27 محافظة مصرية

### الأسعار الافتراضية (من القاهرة)

| المحافظة | السعر (ج.م) | المحافظة | السعر (ج.م) |
|---|---|---|---|
| القاهرة | 55 | بورسعيد | 70 |
| الجيزة | 55 | الإسماعيلية | 70 |
| القليوبية | 55 | السويس | 70 |
| الإسكندرية | 65 | بني سويف | 75 |
| البحيرة | 65 | الفيوم | 75 |
| الغربية | 65 | المنيا | 75 |
| المنوفية | 65 | أسيوط | 75 |
| الدقهلية | 65 | سوهاج | 100 |
| كفر الشيخ | 65 | قنا | 100 |
| الشرقية | 65 | الأقصر | 100 |
| دمياط | 65 | أسوان | 100 |
| البحر الأحمر | 100 | مطروح | 110 |
| الوادي الجديد | 110 | شمال سيناء | 110 |
| جنوب سيناء | 110 | | |

### قواعد الوزن
- ✅ أول 1000 جرام (1 كجم) = السعر الأساسي
- ✅ كل 1000 جرام إضافي = +7.00 ج.م
- ✅ التوصيل: من الباب إلى الباب (Door to Door)

### مصفوفة الشحن (Origin → Destination)
الأسعار تختلف حسب **مكان المرسل** (المتجر). فيه مصفوفة كاملة `SHIPPING_MATRIX` في `constants/governorates.ts` تغطي 27×27 محافظة.

الأدمن يقدر يغيّر محافظة المرسل من لوحة التحكم ← الأسعار تتحدث تلقائي من المصفوفة.

### مكان التخزين
- **افتراضي**: `constants/governorates.ts` → `DEFAULT_EGYPT_GOVERNORATES`
- **Firestore**: `site_settings/shipping` → `rates[]`
- **الأولوية**: Firestore أولاً → لو مش موجود يستخدم الافتراضي

---

## 🛒 صفحة الـ Checkout — حساب تكلفة الشحن

**الملف**: `app/(store)/checkout/page.tsx`

### كيف يشتغل:

**1. عند فتح الصفحة**: يجيب أسعار الشحن من Firestore
```typescript
getShippingRates().then((data) => setShippingRates(data));
```

**2. اختيار المحافظة**: dropdown بيعرض كل المحافظات المفعّلة مع سعر الشحن
```
القاهرة — شحن 55 ج.م
الإسكندرية — شحن 65 ج.م
...
```

**3. حساب تلقائي**:
```typescript
const activeRateObj = shippingRates.find(r => r.nameAr === selectedGovernorate);
const currentShippingCost = activeRateObj?.price ?? 50;
const finalOrderTotal = totalPrice + currentShippingCost;
```

**4. حفظ مع الطلب**: `shippingCost` يُحفظ في Firestore كجزء من بيانات الطلب
```typescript
const orderPayload: CreateOrderInput = {
  subtotal: totalPrice,              // مجموع المنتجات
  shippingCost: currentShippingCost, // تكلفة الشحن
  total: finalOrderTotal,            // الإجمالي النهائي
};
```

### التحقق من البيانات (Zod Schema)
```typescript
checkoutSchema = z.object({
  customerName: z.string().min(2),
  phone: egyptPhone,              // regex: أرقام مصرية فقط
  secondaryPhone: egyptPhone,     // إجباري!
  whatsappPhone: z.string().optional(),
  governorate: z.string().min(2),
  city: z.string().min(2),
  address: z.string().min(8),
  notes: z.string().optional(),
  paymentMethod: z.enum(["cash_on_delivery", "vodafone_cash", "instapay"]),
  transferPhone: z.string().optional(), // إجباري لو الدفع أونلاين
});
```

### حقول الفورم
| الحقل | إجباري | التحقق |
|---|---|---|
| الاسم بالكامل | ✅ | 2 حروف على الأقل |
| رقم الهاتف الأساسي | ✅ | رقم مصري (01X-XXXXXXXX) |
| رقم هاتف إضافي | ✅ | رقم مصري |
| رقم الواتساب | ❌ | رقم مصري لو موجود |
| المحافظة | ✅ | dropdown من Firestore |
| المنطقة / الحي | ✅ | 2 حروف |
| العنوان بالتفصيل | ✅ | 8 حروف على الأقل |
| ملاحظات | ❌ | — |
| رقم التحويل | ✅* | إجباري لو الدفع أونلاين |

---

## 🖥️ لوحة التحكم — إدارة الشحن (Admin)

### 1. إدارة أسعار الشحن (`/admin/shipping`)

**المميزات:**
- جدول بكل 27 محافظة مصرية
- تعديل سعر الشحن الأساسي (أول 1 كجم) لكل محافظة
- تعديل سعر الكيلو الإضافي
- تفعيل/تعطيل أي محافظة
- بحث بالاسم (عربي/إنجليزي)
- **Matrix Presets**: اختيار محافظة المرسل ← تحميل الأسعار تلقائي من مصفوفة الشحن
- حفظ الأسعار في Firestore → تنعكس فوراً على صفحة الـ Checkout

**Firestore Functions المستخدمة:**
```typescript
getShippingRates(): Promise<GovernorateRate[]>   // جلب الأسعار
updateShippingRates(rates: GovernorateRate[]): Promise<void>  // تحديث الأسعار
```

### 2. إدارة الطلبات — قسم الشحن (`/admin/orders`)

**المميزات المتعلقة بالشحن:**

| الميزة | التفاصيل |
|---|---|
| **فلترة بالحالة** | tabs: الكل / انتظار / مؤكدة / جارٍ الشحن / مُسلَّمة / ملغية |
| **إدخال رقم تتبع يدوي** | input field + زر حفظ → يغيّر الحالة لـ `shipping` تلقائي |
| **عرض رقم التتبع** | لو موجود → يعرضه مع اسم شركة الشحن + زر نسخ |
| **عرض أخطاء الشحن** | `shippingError` يظهر كـ alert أحمر |
| **نسخ بيانات الشحن** | زرار يعمل نسخ لكل بيانات العميل (اسم، هاتف، عنوان، منتجات، مبلغ) |
| **إرسال رسالة WhatsApp** | رسالة تأكيد جاهزة بتفاصيل الطلب والشحن |
| **طباعة بوالص PDF** | طباعة جماعية للطلبات بتفاصيل الشحن |
| **تصدير Excel** | تصدير كل الطلبات لملف Excel |

---

## 🤖 بوت أتمتة الشحن (Python + Playwright)

**المجلد**: `automation/`

### الفكرة
بدل ما الأدمن يدخل موقع وصّلها يدوي ويسجل كل شحنة، البوت يعمل ده تلقائي:
1. يجلب الطلبات المؤكدة من Firestore
2. يفتح موقع وصّلها في Chromium
3. يسجل دخول
4. يملأ فورم الشحنة (اسم، هاتف، عنوان، محافظة، مبلغ)
5. يرسل الفورم
6. يستخرج رقم التتبع
7. يحدّث Firestore (tracking + status = shipping)
8. يبعت إشعار Telegram

### أوضاع التشغيل

```bash
# معالجة كل الطلبات المؤكدة
python main.py

# معالجة طلب واحد
python main.py --order FIRESTORE_ORDER_ID

# وضع المراقبة (كل 60 ثانية)
python main.py --watch

# وضع المراقبة كل دقيقتين
python main.py --watch --interval 120
```

### خوارزمية البوت التفصيلية

```
🚀 Start
  ↓
🔐 Login to Wassalha
  ↓ (يجرب session محفوظة → لو فشلت: username/password)
  ↓
💾 Save session cookies
  ↓
📦 Fetch ready orders (status=confirmed + no tracking)
  ↓
🔁 For each order:
  ├─ 🌐 Navigate to Create Shipment page
  ├─ 📝 Fill form fields (اسم, هاتف, عنوان, محافظة, مبلغ)
  ├─ 📸 Screenshot before submit
  ├─ ✅ Submit form
  ├─ 🔍 Extract tracking number (4 strategies)
  ├─ 📄 Download label PDF (optional)
  ├─ 💾 Update Firestore (tracking + status=shipping)
  ├─ 📱 Send Telegram notification
  └─ ⏳ Wait 3 seconds
  ↓
📊 Print summary (processed / success / failed)
```

### استراتيجية تعبئة الفورم

البوت بيجرب عدة CSS selectors لكل حقل لحد ما يلاقي اللي يشتغل:

```python
field_mappings = [
    ("customerName", [
        '#recipientName', '#recipient_name', '#customerName', '#name',
        'input[name="recipientName"]', 'input[name="name"]',
        'input[placeholder*="اسم"]', 'input[placeholder*="المستلم"]',
    ]),
    ("phone", [
        '#recipientPhone', '#phone', '#mobile',
        'input[name="phone"]', 'input[placeholder*="هاتف"]',
    ]),
    ("address", [...]),
    ("city", [...]),
    ("total", [...]),       // مبلغ COD
    ("items_description", [...]),
    ("notes", [...]),
]
```

### استراتيجية استخراج رقم التتبع (4 مستويات)

| المستوى | الطريقة | التفاصيل |
|---|---|---|
| 1 | CSS Selectors | `.tracking-number`, `.awb-number`, `#trackingNumber` |
| 2 | URL Parsing | `/shipment/{id}`, `?tracking={id}` |
| 3 | Regex | أنماط بريد مصر `EP*********EG`, أرقام 10-15 خانة |
| 4 | Fallback | screenshot + إدخال يدوي من لوحة التحكم |

### ربط المحافظات (`governorate_mapping.py`)

```python
GOVERNORATE_MAP = {
    "القاهرة":        "القاهرة",
    "الجيزة":         "الجيزة",
    "القليوبية":      "القليوبية",
    "الإسكندرية":     "الإسكندرية",
    # ... 27 محافظة
}
```

⚠️ القيم محتاجة تتأكد ضد dropdown وصّلها الفعلي عند أول تشغيل.

### المتطلبات والإعداد

**مكتبات Python:**
```
firebase-admin>=6.0.0
playwright>=1.40.0
python-dotenv>=1.0.0
```

**ملف `.env`:**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
SHIPPING_SITE_URL=https://wassalha.egyptpost.org
SHIPPING_USERNAME=your-username
SHIPPING_PASSWORD=your-password
HEADLESS=false          # false للمعايرة / true للإنتاج
AUTO_DOWNLOAD_LABEL=true
LABELS_DIR=./storage/labels
TELEGRAM_BOT_TOKEN=     # اختياري
TELEGRAM_CHAT_ID=       # اختياري
```

**خطوات التثبيت:**
```bash
cd automation
pip install -r requirements.txt
playwright install chromium
# أنشئ .env من .env.example
# حمّل service-account.json من Firebase Console
```

### هيكل مجلد التخزين (يُنشأ تلقائي)
```
automation/storage/
├── session_state.json    # حفظ جلسة الدخول (cookies)
├── labels/               # ملفات PDF البوالص + screenshots
└── logs/                 # سجلات التشغيل اليومية (shipping_YYYY-MM-DD.log)
```

---

## 💾 Firestore Data Model

### Collection: `orders`

كل طلب بيتخزن كـ document في collection اسمها `orders`:

```json
{
  "customerName": "أحمد محمد",
  "phone": "01012345678",
  "secondaryPhone": "01112345678",
  "whatsappPhone": "01012345678",
  "governorate": "القاهرة",
  "city": "المعادي",
  "address": "شارع 9 عمارة 15 الدور 3",
  "notes": "الرجاء الاتصال قبل الوصول",
  "paymentMethod": "cash_on_delivery",
  "items": [
    {
      "productId": "abc123",
      "productName": "تيشيرت أوفرسايز",
      "productImage": "https://...",
      "price": 350,
      "quantity": 2,
      "selectedSize": "L",
      "selectedColor": { "name": "أسود", "hex": "#000", "image": "https://..." }
    }
  ],
  "subtotal": 700,
  "shippingCost": 55,
  "total": 755,
  "status": "shipping",
  "createdAt": "2026-08-19T12:00:00Z",
  "stockDeducted": true,

  "trackingNumber": "EP123456789EG",
  "shippingProvider": "egypt_post",
  "shippedAt": "2026-08-19T14:00:00Z",
  "shippingError": null,
  "shippingLabelUrl": null
}
```

### Collection: `site_settings` → Document: `shipping`

```json
{
  "rates": [
    { "id": "cairo", "nameAr": "القاهرة", "nameEn": "Cairo", "price": 55, "active": true, "additionalKgPrice": 7 },
    { "id": "giza", "nameAr": "الجيزة", "nameEn": "Giza", "price": 55, "active": true, "additionalKgPrice": 7 }
  ],
  "updatedAt": "2026-08-19T12:00:00Z"
}
```

### Firestore Functions — مرجع كامل

| الدالة | الوظيفة |
|---|---|
| `getShippingRates()` | جلب أسعار الشحن (Firestore أولاً → fallback للافتراضي) |
| `updateShippingRates(rates)` | تحديث أسعار الشحن في Firestore |
| `getOrdersReadyForShipping()` | جلب الطلبات المؤكدة بدون رقم تتبع |
| `updateOrderShippingInfo(orderId, data)` | تحديث tracking + status=shipping |
| `setOrderShippingError(orderId, msg)` | تسجيل خطأ شحن على الطلب |
| `setManualTrackingNumber(orderId, num)` | إدخال رقم تتبع يدوي (fallback) |
| `updateOrderStatus(id, newStatus, prev)` | تغيير حالة الطلب + إدارة المخزون |
| `createOrder(input)` | إنشاء طلب جديد مع shippingCost |
| `getOrderById(id)` | جلب طلب واحد |

---

## 📱 إشعارات Telegram

البوت يبعت إشعار Telegram لما ينجح يسجل شحنة. الرسالة بتشمل:

```
📦 تم تسجيل شحنة جديدة

🔢 رقم الطلب: #ABC12345
👤 العميل: أحمد محمد
📍 المحافظة: القاهرة
📱 الهاتف: 01012345678
💵 المبلغ: 755 ج.م

🛍️ المنتجات:
  • تيشيرت أوفرسايز x2

🏷️ رقم البوليصة: EP123456789EG
🚚 الشركة: بريد مصر (وصّلها)
```

**الإعداد:**
1. أنشئ بوت Telegram من `@BotFather`
2. احصل على `TELEGRAM_BOT_TOKEN`
3. احصل على `TELEGRAM_CHAT_ID` (ممكن من `@userinfobot`)
4. أضفهم في `automation/.env`

---

## 💬 رسالة تأكيد الطلب (WhatsApp)

الأدمن يقدر يبعت رسالة تأكيد للعميل عبر WhatsApp من لوحة التحكم. الرسالة بتتبني تلقائي:

```
مرحبا أحمد محمد
شكرا لطلبك من LUNO!

تفاصيل طلبك:
-----------------------------------
رقم الطلب: #ABC12345

المنتجات:
- تيشيرت أوفرسايز (L) - أسود (الكمية: 2) - 700.00 ج.م

بيانات التوصيل:
- الاسم: أحمد محمد
- الهاتف: 01012345678
- العنوان: القاهرة - المعادي - شارع 9 عمارة 15

الفاتورة:
- مجموع المنتجات: 700.00 ج.م
- مصاريف الشحن: 55.00 ج.م
- الاجمالي النهائي: 755.00 ج.م
-----------------------------------

لتجهيز طلبك وتسليمه لشركة الشحن فورا، نرجو تأكيد الطلب:
(1) تأكيد الطلب
(2) الغاء الطلب
```

**نسخ بيانات الشحن لشركة الشحن:**
```
📦 بيانات الشحن للطلب #ABC12345
👤 اسم العميل: أحمد محمد
📱 رقم الهاتف الأول: 01012345678
📞 رقم الهاتف الثاني: 01112345678
📍 المحافظة: القاهرة
🏙️ المنطقة/الحي: المعادي
🏠 العنوان بالتفصيل: شارع 9 عمارة 15 الدور 3
🛍️ المنتجات: ...
💵 المبلغ المطلوب تحصيله: 755 ج.م (شامل الشحن)
💳 طريقة الدفع: 🚪 الدفع عند الاستلام
```

---

## 📜 سياسة الشحن والاسترجاع

النص الافتراضي محفوظ في `constants/policies.ts` ويشمل:

| القسم | المحتوى |
|---|---|
| **سياسة الشحن** | الشحن داخل مصر فقط — التأكد من صحة البيانات — مدة التوصيل تختلف |
| **عدم الاستلام** | رفض الاستلام / عدم الرد → العميل يتحمل تكاليف الشحن والمرتجع |
| **الاستبدال** | المنتج غير مستخدم + بحالته الأصلية + Tags موجودة + تكلفة الشحن على العميل |
| **لا يمكن استبدال** | منتجات مستخدمة / مغسولة / تالفة / بدون تغليف |
| **عيب تصنيع** | تواصل فوري + صور/فيديو → الحل حسب الحالة |
| **الاسترجاع** | حسب شروط المتجر — مع مراعاة تكاليف الشحن المنفذة |

---

## 📦 نظام المخزون والشحن

المخزون مرتبط بحالة الطلب تلقائياً:

| الانتقال | ماذا يحدث للمخزون |
|---|---|
| `pending → confirmed` | ▼ **ينخصم** — كل `OrderItem` ينقص `stock` حسب `quantity` |
| `confirmed → cancelled` | ▲ **يرجع** — يُستعاد المخزون كاملاً |
| `shipping → cancelled` | ▲ **يرجع** — يُستعاد المخزون كاملاً |
| `confirmed → shipping` | لا تغيير |
| `shipping → delivered` | لا تغيير |
| حذف طلب (`stockDeducted=true`) | ▲ **يرجع** — قبل الحذف |

**الآلية**: قبل التأكيد يتم فحص المخزون (`validateStockAvailability`). لو المخزون مش كافي، الطلب بيترفض ورسالة خطأ بتظهر للعميل بالمنتج اللي مش متوفر.

---

## 🔮 التحسينات المستقبلية

### 🔴 ضروري
| # | الميزة | التفاصيل |
|---|---|---|
| 1 | صفحة تتبع الشحنة للعميل | `/track-order` — العميل يدخل رقم التتبع ويشوف الحالة |
| 2 | صفحة `/shipping-policy` | الفوتر بيلينك ليها — الصفحة مش موجودة |
| 3 | إشعار العميل برقم التتبع | SMS / WhatsApp / Email لما الحالة تتغير لـ shipping |

### 🟡 مهم
| # | الميزة | التفاصيل |
|---|---|---|
| 4 | Shipping Dashboard في الأدمن | ملخص: كام مستني شحن، كام اتشحن النهاردة |
| 5 | تشغيل البوت من الأدمن | زرار "شحن الطلبات" بدل CLI |
| 6 | طباعة بوليصة فردية (PDF) | label URL موجود في الـ type بس مش مفعّل |
| 7 | معايرة الـ Selectors | تشغيل أول مرة مع `HEADLESS=false` |

### 🟢 إضافي
| # | الميزة | التفاصيل |
|---|---|---|
| 8 | شحن مجاني فوق مبلغ معين | إعداد `freeShippingThreshold` |
| 9 | حساب الوزن الإضافي تلقائي | ربط وزن المنتج بحساب الشحن |
| 10 | دعم شركات شحن إضافية | J&T, Aramex |

---

> ⚠️ **ملاحظة أمنية**: ملفات `.env` و `service-account.json` في مجلد `automation/` مضافة في `.gitignore` ولا يجب رفعها على Git أبداً.
