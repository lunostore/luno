"""
Luno Store — Wassalha (Egypt Post) Shipping Bot
Uses Playwright to automate shipment creation on wassalha.egyptpost.org

⚠️ IMPORTANT: The CSS selectors in this file are based on initial analysis of the
   Wassalha portal. After your first run, you may need to adjust selectors if the
   portal's HTML structure has changed. Run with HEADLESS=false to see the browser.

🔧 HOW TO CALIBRATE:
   1. Set HEADLESS=false in .env
   2. Run: python main.py --order YOUR_TEST_ORDER_ID
   3. Watch the browser and note any fields that fail
   4. Update the selectors below accordingly
"""
import os
import json
import time
from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext
from config import SHIPPING_URL, SHIPPING_USERNAME, SHIPPING_PASSWORD, HEADLESS, LABELS_DIR, AUTO_DOWNLOAD
from governorate_mapping import get_shipping_value
from logger import log

SESSION_FILE = "./storage/session_state.json"


class ShippingBot:
    """Playwright-based automation bot for Wassalha (Egypt Post) shipping portal."""

    def __init__(self):
        self.playwright = None
        self.browser: Browser | None = None
        self.context: BrowserContext | None = None
        self.page: Page | None = None

    def start(self):
        """Launch browser with anti-bot stealth headers and optional session restoration."""
        log("🌐 Starting browser with stealth options...")
        self.playwright = sync_playwright().start()

        self.browser = self.playwright.chromium.launch(
            headless=HEADLESS,
            slow_mo=100,  # Small delay between actions for stability
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
                "--ignore-certificate-errors",
            ],
        )

        user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        context_opts = {
            "user_agent": user_agent,
            "viewport": {"width": 1366, "height": 768},
            "locale": "ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7",
            "timezone_id": "Africa/Cairo",
        }

        # Restore saved session (cookies) to skip login
        os.makedirs("./storage", exist_ok=True)
        if os.path.exists(SESSION_FILE):
            try:
                self.context = self.browser.new_context(storage_state=SESSION_FILE, **context_opts)
                log("   📂 Restored saved session")
            except Exception:
                self.context = self.browser.new_context(**context_opts)
                log("   ⚠️ Could not restore session, starting fresh")
        else:
            self.context = self.browser.new_context(**context_opts)

        self.page = self.context.new_page()
        self.page.set_default_timeout(30000)  # 30 seconds

        # Bypass webdriver detection
        self.page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            window.chrome = {
                runtime: {}
            };
        """)

    def login(self) -> bool:
        """
        Login to Wassalha portal.
        Uses saved session first, falls back to username/password.
        Returns True if login successful.
        """
        log("🔐 [v3.2] Checking login status...")
        
        # Track API responses to see exact server response
        network_logs = []
        def handle_response(response):
            try:
                url_low = response.url.lower()
                if any(x in url_low for x in ["login", "auth", "token", "api", "account", "user", "notification"]):
                    status = response.status
                    try:
                        text = response.text()[:250].strip()
                    except Exception:
                        text = ""
                    network_logs.append((status, response.url, text))
            except Exception:
                pass

        self.page.on("response", handle_response)

        try:
            self.page.goto(f"{SHIPPING_URL}/login", wait_until="domcontentloaded")
            time.sleep(2)
        except Exception as e:
            log(f"   ⚠️ Navigation warning: {e}")

        # Check if we're already logged in (redirected to dashboard)
        current_url = self.page.url
        if "/login" not in current_url:
            log("   ✅ Already logged in (session valid)")
            self._save_session()
            return True

        if not SHIPPING_USERNAME or not SHIPPING_PASSWORD:
            log("   ❌ No credentials provided!")
            return False

        log("   📝 Entering credentials...")

        try:
            # Wait for login form
            username_selectors = ['#userName', '#username', 'input[name="userName"]', 'input[name="username"]', 'input[type="text"]']
            password_selectors = ['#password', '#pass', 'input[name="password"]', 'input[type="password"]']
            
            username_el = None
            for sel in username_selectors:
                try:
                    el = self.page.wait_for_selector(sel, state='visible', timeout=6000)
                    if el:
                        username_el = sel
                        log(f"   📝 Found username field: {sel}")
                        break
                except Exception:
                    continue
            
            if not username_el:
                log("   ❌ Could not find username field on login page")
                log(f"   📄 Current URL: {self.page.url}")
                return False

            password_el = None
            for sel in password_selectors:
                try:
                    el = self.page.query_selector(sel)
                    if el and el.is_visible():
                        password_el = sel
                        log(f"   📝 Found password field: {sel}")
                        break
                except Exception:
                    continue

            if not password_el:
                log("   ❌ Could not find password field")
                return False

            # Type username using realistic keystrokes and dispatch Angular/JS events
            self.page.click(username_el)
            self.page.fill(username_el, '')
            self.page.type(username_el, SHIPPING_USERNAME, delay=30)
            self.page.evaluate(f"""() => {{
                const el = document.querySelector('{username_el}');
                if (el) {{
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                }}
            }}""")
            log(f"   ✅ Username filled ({SHIPPING_USERNAME[:3]}***)")

            # Type password using realistic keystrokes and dispatch Angular/JS events
            self.page.click(password_el)
            self.page.fill(password_el, '')
            self.page.type(password_el, SHIPPING_PASSWORD, delay=30)
            self.page.evaluate(f"""() => {{
                const el = document.querySelector('{password_el}');
                if (el) {{
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                }}
            }}""")
            log(f"   ✅ Password filled (***{len(SHIPPING_PASSWORD)} chars)")

            time.sleep(1)

            # Try clicking login button or pressing Enter
            login_btn_selectors = [
                'button.btn-primary',
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("تسجيل")',
                'button:has-text("دخول")',
                'button:has-text("Login")',
                '.btn-primary',
            ]
            
            clicked = False
            for sel in login_btn_selectors:
                try:
                    btn = self.page.query_selector(sel)
                    if btn and btn.is_visible():
                        btn.click()
                        clicked = True
                        log(f"   ✅ Clicked login button: {sel}")
                        break
                except Exception:
                    continue

            if not clicked:
                log("   ⌨️ Pressing Enter on password input...")
                self.page.press(password_el, 'Enter')

            # Wait for response / navigation
            time.sleep(4)

            # Check if auth/permission API returned 200 OK
            api_login_success = any(
                status == 200 and any(k.lower() in url.lower() for k in ["getusermodulespermission", "getuserpermittedactions", "getmembernotificationcount", "getnumberofusernotifications", "login", "auth"])
                for status, url, text in network_logs
            )

            # Check if token exists in localStorage
            token_in_storage = self.page.evaluate("""() => {
                return !!(localStorage.getItem('token') || localStorage.getItem('user') || sessionStorage.getItem('token') || localStorage.length > 2);
            }""")

            current_url = self.page.url
            if "/login" not in current_url or api_login_success or token_in_storage:
                log(f"   🎉 Login successful! (API 200: {api_login_success}, Storage token: {token_in_storage})")
                self._save_session()
                # Navigate to packages creation page directly
                log("   🚚 Navigating to packages dashboard...")
                try:
                    self.page.goto(f"{SHIPPING_URL}/packages/eb", wait_until="domcontentloaded")
                    time.sleep(3)
                except Exception:
                    pass
                return True

            # If still on login page and no auth API succeeded, check error elements
            error_selectors = [
                '.alert-danger', '.error-message', '.text-danger',
                '.toast-error', '.Toastify__toast--error', '.invalid-feedback',
                'div[role="alert"]', '.swal2-html-container',
            ]
            for es in error_selectors:
                try:
                    eel = self.page.query_selector(es)
                    if eel and eel.is_visible():
                        log(f"   ❌ Login Error on page: {eel.inner_text().strip()}")
                except Exception:
                    pass

            # Log captured network messages to see server status
            if network_logs:
                log("   🔍 Network Responses:")
                for status, url, text in network_logs[-5:]:
                    log(f"      📡 [{status}] {url} -> {text}")

            # Save screenshot for debugging
            os.makedirs("./storage", exist_ok=True)
            self.page.screenshot(path="./storage/login_failed.png")
            log("   📸 Login failure screenshot saved")
            log(f"   📄 Page title: {self.page.title()}")
            log(f"   📄 Current URL: {current_url}")
            return False

        except Exception as e:
            log(f"   ❌ Login error: {e}")
            try:
                os.makedirs("./storage", exist_ok=True)
                self.page.screenshot(path="./storage/login_error.png")
                log("   📸 Error screenshot saved")
            except Exception:
                pass
            return False

    def create_shipment(self, order: dict) -> str | None:
        """
        Create a new shipment on Wassalha for the given order.
        Returns tracking number on success, None on failure.

        ⚠️ This method's selectors need calibration after first run.
           Run with HEADLESS=false and --order flag to test.
        """
        order_id = order.get("id", "?")[:8].upper()
        customer = order.get("customerName", "Unknown")

        log(f"   📦 Creating shipment for #{order_id} ({customer})...")

        try:
            # ── Step 1: Discover and navigate to Create Shipment page / modal ──
            log(f"   🧭 Current page URL: {self.page.url}")
            time.sleep(2)

            # Look for sidebar menu links or buttons for "إضافة شحنة" / "الشحنات"
            menu_clicked = False
            menu_selectors = [
                'a[href*="packages"]',
                'a:has-text("إضافة شحنة")',
                'a:has-text("شحنة جديدة")',
                'a:has-text("الشحنات")',
                'span:has-text("إضافة شحنة")',
                'span:has-text("شحنة جديدة")',
                'span:has-text("الشحنات")',
                'li:has-text("الشحنات")',
                'button:has-text("إضافة شحنة")',
                'button:has-text("شحنة جديدة")',
                'button:has-text("إضافة")',
                'a.btn:has-text("إضافة")',
                '.btn-primary',
                '.btn-success',
            ]

            # First log all visible clickable buttons/links for diagnosis
            try:
                elements_info = self.page.evaluate("""() => {
                    const items = [];
                    document.querySelectorAll('button, a, .btn, [role="button"]').forEach(el => {
                        const txt = (el.innerText || el.textContent || '').trim();
                        const href = el.getAttribute('href') || '';
                        const cls = el.className || '';
                        if (txt || href) {
                            items.push(`tag=${el.tagName}, text="${txt.slice(0,30)}", href="${href}", class="${cls.slice(0,30)}"`);
                        }
                    });
                    return items.slice(0, 15);
                }""")
                if elements_info:
                    log("   🔍 Page Interactive Elements:")
                    for einfo in elements_info:
                        log(f"      👉 {einfo}")
            except Exception:
                pass

            # Try clicking menu / add buttons
            for selector in menu_selectors:
                try:
                    btns = self.page.query_selector_all(selector)
                    for b in btns:
                        if b.is_visible():
                            btxt = b.inner_text().strip()
                            if any(w in btxt for w in ["إضافة", "شحنة", "شحنات", "New", "Add", "Package"]):
                                b.click()
                                time.sleep(2)
                                log(f"   ✅ Clicked package action: {selector} (text: '{btxt}')")
                                menu_clicked = True
                                break
                    if menu_clicked:
                        break
                except Exception:
                    continue

            # If not clicked, try navigating to package creation URLs
            if not menu_clicked:
                create_urls = [
                    f"{SHIPPING_URL}/#/packages/eb/create",
                    f"{SHIPPING_URL}/#/packages/add",
                    f"{SHIPPING_URL}/#/packages/create",
                    f"{SHIPPING_URL}/packages/eb",
                ]
                for url in create_urls:
                    try:
                        self.page.goto(url, wait_until="domcontentloaded")
                        time.sleep(2)
                        if "/login" not in self.page.url:
                            break
                    except Exception:
                        pass

            # Log inputs on current page
            try:
                inputs_info = self.page.evaluate("""() => {
                    const inputs = [];
                    document.querySelectorAll('input, select, textarea').forEach(el => {
                        const id = el.id || '';
                        const name = el.name || '';
                        const placeholder = el.placeholder || '';
                        const type = el.type || el.tagName.toLowerCase();
                        inputs.push(`tag=${el.tagName}, id="${id}", name="${name}", type="${type}", placeholder="${placeholder}"`);
                    });
                    return inputs;
                }""")
                if inputs_info:
                    log(f"   📝 Detected {len(inputs_info)} form inputs on page:")
                    for inp in inputs_info[:15]:
                        log(f"      📥 {inp}")
            except Exception:
                pass

            # ── Step 3: Fill the shipment form ──
            # These selectors need to be calibrated on first run.
            # Common patterns for shipping forms:

            # ── Step 3: Fill the shipment form ──
            # Determine payment & COD amount rules:
            payment_method = order.get("paymentMethod", "cash_on_delivery")
            is_online_payment = payment_method in ["vodafone_cash", "instapay"]

            # Rule 1: COD Amount (مبلغ التحصيل عند التسليم)
            # - Cash: full order total (items + shipping)
            # - Online payment: 3 spaces ("   ") so no number is typed
            cod_amount = "   " if is_online_payment else str(order.get("total", 0))

            # Rule 2: Special Notes (ملاحظات خاصة)
            customer_notes = (order.get("notes") or "").strip()
            special_notes = "كفر شحن وبوليصة شحن"
            if customer_notes:
                special_notes = f"{special_notes} - {customer_notes}"

            form_data = {
                "customerName": order.get("customerName", ""),
                "phone": order.get("phone", ""),
                "secondaryPhone": order.get("secondaryPhone", ""),
                "governorate": get_shipping_value(order.get("governorate", "")),
                "city": order.get("city", ""),
                "address": order.get("address", ""),
                "total": cod_amount,
                "weight": "500",  # Rule 3: Weight = 500 grams
                "items_description": "ملابس",  # Rule 4: Content description = ملابس
                "notes": special_notes,  # Rule 5: Special Notes = كفر شحن وبوليصة شحن
            }

            # Field selectors tuned specifically for Wassalha form inputs
            field_mappings = [
                ("items_description", [
                    'textarea[placeholder*="وصف"]', 'textarea[placeholder*="محتوى"]',
                    'textarea[placeholder*="المحتوى"]', '#contents', '#description',
                    'input[name*="description"]', 'textarea[name*="description"]',
                    'textarea:has-text("")',
                ]),
                ("notes", [
                    'textarea[placeholder*="ملاحظات"]', 'textarea[placeholder*="خاصة"]',
                    '#specialNotes', '#notes', '#remarks',
                    'textarea[name*="notes"]', 'textarea[name*="remarks"]',
                ]),
                ("weight", [
                    'input[placeholder*="الوزن"]', 'input[placeholder*="وزن"]',
                    '#weight', '#packageWeight', 'input[name*="weight"]',
                ]),
                ("total", [
                    'input[placeholder*="التحصيل"]', 'input[placeholder*="مبلغ"]',
                    '#codAmount', '#cod', '#amount', '#cashOnDelivery',
                    'input[name*="cod"]', 'input[name*="amount"]',
                ]),
                ("customerName", [
                    '#recipientName', '#recipient_name', '#customerName', '#name',
                    'input[name="recipientName"]', 'input[name="name"]',
                    'input[placeholder*="اسم"]', 'input[placeholder*="المستلم"]',
                ]),
                ("phone", [
                    '#recipientPhone', '#phone', '#mobile', '#recipientMobile',
                    'input[name="phone"]', 'input[name="mobile"]',
                    'input[name="recipientPhone"]',
                    'input[placeholder*="هاتف"]', 'input[placeholder*="موبايل"]',
                ]),
                ("secondaryPhone", [
                    '#phone2', '#secondaryPhone', '#alternatePhone',
                    'input[name="phone2"]', 'input[name="alternatePhone"]',
                    'input[placeholder*="بديل"]', 'input[placeholder*="ثاني"]',
                ]),
                ("address", [
                    '#address', '#recipientAddress', '#streetAddress',
                    'input[name="address"]', 'textarea[name="address"]',
                    'input[placeholder*="عنوان"]', 'textarea[placeholder*="عنوان"]',
                ]),
                ("city", [
                    '#city', '#district', '#area',
                    'input[name="city"]', 'input[name="district"]',
                    'input[placeholder*="مدينة"]', 'input[placeholder*="منطقة"]',
                ]),
            ]

            filled_fields = []
            for field_key, selectors in field_mappings:
                value = form_data.get(field_key, "")
                if not value:
                    continue

                filled = False
                for selector in selectors:
                    try:
                        el = self.page.query_selector(selector)
                        if el and el.is_visible():
                            tag = el.evaluate("el => el.tagName.toLowerCase()")
                            if tag == "textarea":
                                el.fill(value)
                            else:
                                el.fill("")
                                el.fill(value)
                            filled = True
                            filled_fields.append(field_key)
                            break
                    except Exception:
                        continue

                if not filled:
                    log(f"   ⚠️ Could not find field: {field_key}")

            # ── Step 4: Handle governorate dropdown ──
            gov_value = form_data["governorate"]
            if gov_value:
                gov_selectors = [
                    '#governorate', '#city_gov', '#receiverGovernorate',
                    'select[name="governorate"]', 'select[name="city"]',
                ]
                for selector in gov_selectors:
                    try:
                        el = self.page.query_selector(selector)
                        if el and el.is_visible():
                            # Try selecting by text content first (more reliable with Arabic)
                            self.page.select_option(selector, label=gov_value)
                            filled_fields.append("governorate")
                            break
                    except Exception:
                        try:
                            # Fallback: try by value
                            self.page.select_option(selector, value=gov_value)
                            filled_fields.append("governorate")
                            break
                        except Exception:
                            continue

            log(f"   📝 Filled {len(filled_fields)} fields: {', '.join(filled_fields)}")

            # ── Step 5: Take screenshot before submission ──
            os.makedirs(LABELS_DIR, exist_ok=True)
            screenshot_path = os.path.join(LABELS_DIR, f"pre_submit_{order_id}.png")
            self.page.screenshot(path=screenshot_path)
            log(f"   📸 Pre-submit screenshot saved: {screenshot_path}")

            # ── Step 6: Submit the form ──
            submit_selectors = [
                'button[type="submit"]',
                'button:has-text("حفظ")',
                'button:has-text("إنشاء")',
                'button:has-text("تأكيد")',
                'button:has-text("Save")',
                'button:has-text("Create")',
                'button:has-text("Submit")',
                '.btn-primary[type="submit"]',
                'input[type="submit"]',
            ]

            submitted = False
            for selector in submit_selectors:
                try:
                    btn = self.page.query_selector(selector)
                    if btn and btn.is_visible():
                        btn.click()
                        self.page.wait_for_load_state("networkidle")
                        time.sleep(3)
                        submitted = True
                        log(f"   ✅ Form submitted via: {selector}")
                        break
                except Exception:
                    continue

            if not submitted:
                log("   ❌ Could not find submit button!")
                log("   💡 Run with HEADLESS=false and manually inspect the form")
                return None

            # ── Step 7: Extract tracking number ──
            tracking = self._extract_tracking_number()

            # ── Step 8: Download label PDF (optional) ──
            if tracking and AUTO_DOWNLOAD:
                self._download_label(tracking, order_id)

            return tracking

        except Exception as e:
            log(f"   ❌ Shipment creation error: {e}")
            # Take error screenshot
            try:
                err_path = os.path.join(LABELS_DIR, f"error_{order_id}.png")
                self.page.screenshot(path=err_path)
                log(f"   📸 Error screenshot: {err_path}")
            except Exception:
                pass
            return None

    def _extract_tracking_number(self) -> str | None:
        """
        Extract tracking number from the success page after form submission.

        ⚠️ This method needs calibration. Common patterns:
        - Look for a success message with a code/number
        - Check for elements with class names like 'tracking', 'barcode', 'awb'
        - Check the URL for an ID parameter
        - Intercept network responses
        """
        log("   🔍 Extracting tracking number...")

        try:
            # Strategy 1: Look for common tracking number elements
            tracking_selectors = [
                '.tracking-number', '.trackingNumber', '.awb-number',
                '.barcode-text', '.shipment-id', '.order-id',
                '[data-tracking]', '[data-awb]',
                '.success-message .code', '.alert-success .font-mono',
                'td:has-text("رقم التتبع") + td',
                'td:has-text("Tracking") + td',
                'span.badge', '.tracking', '#trackingNumber',
            ]

            for selector in tracking_selectors:
                try:
                    el = self.page.query_selector(selector)
                    if el:
                        text = el.inner_text().strip()
                        if text and len(text) >= 4:  # Tracking numbers are usually 4+ chars
                            log(f"   🎯 Found via selector: {selector}")
                            return text
                except Exception:
                    continue

            # Strategy 2: Check URL for tracking/order ID
            import re
            current_url = self.page.url
            url_patterns = [
                r'/shipment/(\w+)',
                r'/tracking/(\w+)',
                r'/order/(\w+)',
                r'id=(\w+)',
                r'tracking=(\w+)',
            ]
            for pattern in url_patterns:
                match = re.search(pattern, current_url)
                if match:
                    tracking = match.group(1)
                    if len(tracking) >= 4:
                        log(f"   🎯 Found in URL: {tracking}")
                        return tracking

            # Strategy 3: Look for any element that looks like a tracking number
            # (alphanumeric, 8-20 chars, possibly with dashes)
            page_text = self.page.inner_text('body')
            tracking_patterns = [
                r'(?:EP|EG|RR|CV)\d{9,13}(?:EG)?',  # Egypt Post format
                r'[A-Z]{2}\d{9}[A-Z]{2}',            # International postal format
                r'\b\d{10,15}\b',                      # Pure numeric tracking
            ]
            for pattern in tracking_patterns:
                match = re.search(pattern, page_text)
                if match:
                    tracking = match.group(0)
                    log(f"   🎯 Found via regex pattern: {tracking}")
                    return tracking

            # Strategy 4: Take screenshot for manual inspection
            log("   ⚠️ Could not auto-extract tracking number")
            log("   💡 Check the screenshot and enter manually in admin panel")

            return None

        except Exception as e:
            log(f"   ❌ Tracking extraction error: {e}")
            return None

    def _download_label(self, tracking: str, order_id: str):
        """Download shipping label PDF if available."""
        os.makedirs(LABELS_DIR, exist_ok=True)

        try:
            # Look for print/download button
            download_selectors = [
                'a:has-text("طباعة")', 'a:has-text("Print")',
                'button:has-text("طباعة")', 'button:has-text("Print")',
                'a[href*="label"]', 'a[href*="print"]',
                'a[href*="pdf"]', 'button:has-text("PDF")',
            ]

            for selector in download_selectors:
                try:
                    btn = self.page.query_selector(selector)
                    if btn and btn.is_visible():
                        with self.page.expect_download(timeout=15000) as download_info:
                            btn.click()
                        download = download_info.value
                        save_path = os.path.join(LABELS_DIR, f"{order_id}_{tracking}.pdf")
                        download.save_as(save_path)
                        log(f"   📄 Label saved: {save_path}")
                        return
                except Exception:
                    continue

            log("   ℹ️ No downloadable label found (optional)")
        except Exception as e:
            log(f"   ⚠️ Label download failed: {e}")

    def _save_session(self):
        """Save browser session (cookies) for faster login next time."""
        try:
            os.makedirs("./storage", exist_ok=True)
            self.context.storage_state(path=SESSION_FILE)
        except Exception:
            pass

    def stop(self):
        """Close browser and cleanup."""
        log("🔒 Closing browser...")
        try:
            if self.context:
                self._save_session()
                self.context.close()
            if self.browser:
                self.browser.close()
            if self.playwright:
                self.playwright.stop()
        except Exception:
            pass
