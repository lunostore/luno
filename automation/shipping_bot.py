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
            # ── Step 1: Open Add New Package Modal in Easy Box (/packages/eb) ──
            log(f"   🧭 Current page URL: {self.page.url}")
            if "/packages/eb" not in self.page.url:
                self.page.goto(f"{SHIPPING_URL}/packages/eb", wait_until="domcontentloaded")
                time.sleep(3)

            # Click the 'Add New' button at top right
            add_btn_clicked = False
            add_selectors = [
                'button:has-text("Add New")',
                'a:has-text("Add New")',
                'button:has-text("إضافة شحنة")',
                'button:has-text("إضافة")',
                'button.btn-outline-secondary',
                '.btn-outline-secondary',
            ]
            for sel in add_selectors:
                try:
                    btn = self.page.query_selector(sel)
                    if btn and btn.is_visible():
                        btn.click()
                        time.sleep(2)
                        log(f"   ✅ Opened 'Add new package' modal via: {sel}")
                        add_btn_clicked = True
                        break
                except Exception:
                    continue

            # Wait for modal to render
            time.sleep(2)

            # ── Step 2: Prepare Shipment Data ──
            payment_method = order.get("paymentMethod", "cash_on_delivery")
            is_online_payment = payment_method in ["vodafone_cash", "instapay"]

            # Rule 1: COD Amount
            cod_amount = "   " if is_online_payment else str(order.get("total", 0))

            # Rule 2: Special Notes
            customer_notes = (order.get("notes") or "").strip()
            special_notes = "كفر شحن وبوليصة شحن"
            if customer_notes:
                special_notes = f"{special_notes} - {customer_notes}"

            filled_fields = []

            # ── Step 3: Tab 1 - Shipment Details ──
            try:
                shipment_tab = self.page.query_selector('a:has-text("Shipment Details"), button:has-text("Shipment Details"), a:has-text("بيانات الشحنة"), [href*="shipment"]')
                if shipment_tab and shipment_tab.is_visible():
                    shipment_tab.click()
                    time.sleep(1)
                    log("   📂 Switched to 'Shipment Details' tab")
            except Exception:
                pass

            # Fill Shipment Details fields (Exact verified IDs: pkgDescription, pkgWeight, COD)
            try:
                # Description of content
                desc_el = self.page.query_selector('#pkgDescription, textarea[name*="description"], [formcontrolname*="description"]')
                if desc_el and desc_el.is_visible():
                    desc_el.fill("ملابس")
                    desc_el.dispatch_event('input')
                    filled_fields.append("pkgDescription")

                # Weight = 500
                weight_el = self.page.query_selector('#pkgWeight, input[name*="weight"], [formcontrolname*="weight"]')
                if weight_el and weight_el.is_visible():
                    weight_el.fill("500")
                    weight_el.dispatch_event('input')
                    filled_fields.append("pkgWeight")

                # COD Amount
                cod_el = self.page.query_selector('#COD, input[name*="COD"], input[name*="cod"], [formcontrolname*="cod"]')
                if cod_el and cod_el.is_visible():
                    cod_el.fill(cod_amount)
                    cod_el.dispatch_event('input')
                    filled_fields.append("COD")

                # Special Notes
                notes_el = self.page.query_selector('#pkgNotes, textarea[name*="notes"], #specialNotes, textarea')
                if notes_el and notes_el.is_visible():
                    notes_el.fill(special_notes)
                    notes_el.dispatch_event('input')
                    filled_fields.append("pkgNotes")
            except Exception as e:
                log(f"   ⚠️ Shipment details tab fill warning: {e}")

            # ── Step 4: Tab 2 - Consignee Details (Customer info) ──
            try:
                consignee_tab = self.page.query_selector('a:has-text("Consignee Details"), button:has-text("Consignee Details"), a:has-text("بيانات المستلم"), [href*="consignee"], [href*="customer"]')
                if consignee_tab and consignee_tab.is_visible():
                    consignee_tab.click()
                    time.sleep(1)
                    log("   📂 Switched to 'Consignee Details' tab")
            except Exception:
                pass

            # Fill Consignee Details fields (Exact verified IDs: customerName, customerMobile, customerStreet, City)
            try:
                # Customer Name
                name_el = self.page.query_selector('#customerName, #CustomerName, input[name*="customerName"], [formcontrolname*="name"]')
                if name_el and name_el.is_visible():
                    name_el.fill(order.get("customerName", ""))
                    name_el.dispatch_event('input')
                    filled_fields.append("customerName")

                # Mobile Number
                phone_el = self.page.query_selector('#customerMobile, #CustomerMobile, #mobile, input[name*="mobile"], [formcontrolname*="phone"]')
                if phone_el and phone_el.is_visible():
                    phone_el.fill(order.get("phone", ""))
                    phone_el.dispatch_event('input')
                    filled_fields.append("customerMobile")

                # Full Address / Street
                street_el = self.page.query_selector('#customerStreet, #CustomerStreet, #address, textarea[name*="street"], input[name*="street"]')
                if street_el and street_el.is_visible():
                    street_el.fill(order.get("address", ""))
                    street_el.dispatch_event('input')
                    filled_fields.append("customerStreet")

                # City / Governorate Dropdown
                gov_val = get_shipping_value(order.get("governorate", ""))
                city_sel = self.page.query_selector('#City, select[name="city"], select[name="governorate"], select')
                if city_sel and city_sel.is_visible() and gov_val:
                    try:
                        city_sel.select_option(label=gov_val)
                        filled_fields.append("City")
                    except Exception:
                        try:
                            city_sel.select_option(value=gov_val)
                            filled_fields.append("City")
                        except Exception:
                            pass
            except Exception as e:
                log(f"   ⚠️ Consignee details tab fill warning: {e}")

            log(f"   📝 Filled {len(filled_fields)} verified fields: {', '.join(filled_fields)}")

            # ── Step 3: Take screenshot before submission ──
            os.makedirs(LABELS_DIR, exist_ok=True)
            screenshot_path = os.path.join(LABELS_DIR, f"pre_submit_{order_id}.png")
            self.page.screenshot(path=screenshot_path)
            log(f"   📸 Pre-submit screenshot saved: {screenshot_path}")

            # ── Step 4: Submit the form (Save and Close) & Intercept Tracking Response ──
            submit_selectors = [
                'a.btn-Send',
                '.btn-Send',
                'a:has-text("Save and Close")',
                'button:has-text("Save and Close")',
                'a:has-text("حفظ وإغلاق")',
                'button:has-text("حفظ وإغلاق")',
                'button[type="submit"]',
                'button:has-text("حفظ")',
                'button:has-text("Save")',
                'input[type="submit"]',
            ]

            # Intercept submit API network responses
            captured_tracking = []
            def on_submit_response(res):
                try:
                    rurl = res.url.lower()
                    if any(w in rurl for w in ["package", "shipment", "save", "create", "eb", "order"]):
                        rtext = res.text()
                        import re
                        # Look for tracking code / barcode in JSON response
                        matches = re.findall(r'(?:EG|EP|EB)\d{8,14}(?:EG)?|\b\d{10,14}\b', rtext)
                        for m in matches:
                            captured_tracking.append(m)
                except Exception:
                    pass

            self.page.on("response", on_submit_response)

            submitted = False
            for selector in submit_selectors:
                try:
                    btn = self.page.query_selector(selector)
                    if btn and btn.is_visible():
                        btn.click()
                        time.sleep(4)
                        submitted = True
                        log(f"   ✅ Form submitted via: {selector}")
                        break
                except Exception:
                    continue

            if not submitted:
                log("   ❌ Could not find submit button!")
                return None

            # ── Step 5: Extract tracking number ──
            tracking = None
            if captured_tracking:
                tracking = captured_tracking[0]
                log(f"   🎯 Intercepted tracking number from API: {tracking}")
            else:
                tracking = self._extract_tracking_number()

            # ── Step 6: Download label PDF (optional) ──
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
