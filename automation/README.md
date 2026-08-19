# 🚀 Luno Store — Shipping Automation Bot

> أتمتة تسجيل الشحنات على **بريد مصر (وصّلها)** باستخدام Python + Playwright

---

## 📋 المتطلبات

- **Python 3.10+**
- **حساب على Wassalha** (wassalha.egyptpost.org)
- **Firebase Service Account** JSON file

---

## ⚡ التثبيت السريع

```bash
# 1. الانتقال لمجلد الأتمتة
cd automation

# 2. تثبيت المكتبات
pip install -r requirements.txt

# 3. تثبيت متصفح Chromium لـ Playwright
playwright install chromium

# 4. إعداد ملف البيئة
copy .env.example .env
# ← عدّل .env وأضف بيانات الدخول لموقع وصّلها

# 5. نسخ ملف Service Account من Firebase
# Firebase Console → Project Settings → Service Accounts → Generate New Private Key
# احفظ الملف باسم service-account.json في هذا المجلد
```

---

## 🎯 طريقة الاستخدام

### معالجة كل الطلبات المؤكدة
```bash
python main.py
```

### معالجة طلب محدد
```bash
python main.py --order FIRESTORE_ORDER_ID
```

### وضع المراقبة المستمرة (كل 60 ثانية)
```bash
python main.py --watch
```

### وضع المراقبة كل دقيقتين
```bash
python main.py --watch --interval 120
```

---

## 🔧 المعايرة (Calibration)

عند أول تشغيل، شغّل البوت مع `HEADLESS=false` في ملف `.env` لمشاهدة المتصفح:

```bash
# في .env
HEADLESS=false

# شغّل على طلب تجريبي
python main.py --order YOUR_TEST_ORDER_ID
```

راقب المتصفح وتأكد من:
1. ✅ تسجيل الدخول يعمل
2. ✅ الحقول تُملأ بشكل صحيح
3. ✅ الفورم يُرسل بنجاح
4. ✅ رقم التتبع يُستخرج

إذا فشل حقل معين، عدّل الـ Selectors في `shipping_bot.py`.

---

## 📁 هيكل الملفات

```
automation/
├── .env                          # بيانات الدخول (لا يُرفع على Git)
├── .env.example                  # قالب البيانات المطلوبة
├── requirements.txt              # المكتبات
├── service-account.json          # Firebase Admin SDK key (لا يُرفع على Git)
├── main.py                       # نقطة الدخول الرئيسية
├── config.py                     # قراءة الإعدادات
├── firebase_client.py            # الاتصال بقاعدة البيانات
├── shipping_bot.py               # محرك Playwright — أتمتة وصّلها
├── governorate_mapping.py        # ربط المحافظات
├── logger.py                     # نظام السجلات
└── storage/
    ├── session_state.json        # حفظ جلسة الدخول (تلقائي)
    ├── labels/                   # ملفات PDF البوالص
    └── logs/                     # سجلات التشغيل اليومية
```

---

## 🔒 الأمان

- ❌ لا ترفع `.env` أو `service-account.json` على Git
- ✅ الملفات مضافة تلقائياً في `.gitignore`
- ✅ الجلسة المحفوظة (`session_state.json`) تبقى محلياً فقط

---

## 💰 التكلفة: مجاني 100%

| العنصر | التكلفة |
|---|---|
| Python | مجاني |
| Playwright | مجاني (Open Source) |
| Firebase Admin SDK | مجاني |
| تشغيل على جهازك | مجاني |
