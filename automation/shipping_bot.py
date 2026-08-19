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
        """Launch browser with optional session restoration."""
        log("🌐 Starting browser...")
        self.playwright = sync_playwright().start()

        self.browser = self.playwright.chromium.launch(
            headless=HEADLESS,
            slow_mo=200,  # Small delay between actions for stability
        )

        # Restore saved session (cookies) to skip login
        os.makedirs("./storage", exist_ok=True)
        if os.path.exists(SESSION_FILE):
            try:
                self.context = self.browser.new_context(storage_state=SESSION_FILE)
                log("   📂 Restored saved session")
            except Exception:
                self.context = self.browser.new_context()
                log("   ⚠️ Could not restore session, starting fresh")
        else:
            self.context = self.browser.new_context()

        self.page = self.context.new_page()
        self.page.set_default_timeout(30000)  # 30 seconds

    def login(self) -> bool:
        """
        Login to Wassalha portal.
        Uses saved session first, falls back to username/password.
        Returns True if login successful.
        """
        log("🔐 Checking login status...")
        self.page.goto(f"{SHIPPING_URL}/login", wait_until="networkidle")
        time.sleep(2)

        # Check if we're already logged in (redirected to dashboard)
        current_url = self.page.url
        if "/login" not in current_url:
            log("   ✅ Already logged in (session valid)")
            self._save_session()
            return True

        if not SHIPPING_USERNAME or not SHIPPING_PASSWORD:
            log("   ❌ No credentials in .env file!")
            return False

        log("   📝 Entering credentials...")

        # Wassalha login form fields (from portal analysis):
        # - Username: id="userName"
        # - Password: id="password"
        # - Login button: button.btn-primary
        try:
            # Wait for login form
            self.page.wait_for_selector('#userName', state='visible', timeout=10000)

            # Clear and fill username
            self.page.fill('#userName', '')
            self.page.fill('#userName', SHIPPING_USERNAME)

            # Clear and fill password
            self.page.fill('#password', '')
            self.page.fill('#password', SHIPPING_PASSWORD)

            # Click login button
            self.page.click('button.btn-primary')
            self.page.wait_for_load_state("networkidle")
            time.sleep(3)

            # Verify login success
            current_url = self.page.url
            if "/login" in current_url:
                # Check for error messages
                error_el = self.page.query_selector('.alert-danger, .error-message, .text-danger')
                if error_el:
                    error_text = error_el.inner_text()
                    log(f"   ❌ Login failed: {error_text}")
                else:
                    log("   ❌ Login failed: still on login page")
                return False

            log("   ✅ Login successful!")
            self._save_session()
            return True

        except Exception as e:
            log(f"   ❌ Login error: {e}")
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
            # ── Step 1: Navigate to Create Shipment page ──
            # Try common Wassalha URLs for shipment creation
            create_urls = [
                f"{SHIPPING_URL}/packages/eb",          # Known packages page
                f"{SHIPPING_URL}/shipment/create",
                f"{SHIPPING_URL}/packages/create",
                f"{SHIPPING_URL}/order/create",
            ]

            navigated = False
            for url in create_urls:
                self.page.goto(url, wait_until="networkidle")
                time.sleep(2)
                # Check if page loaded (not 404 or redirected to login)
                if "/login" in self.page.url:
                    log("   ⚠️ Session expired, re-logging in...")
                    if not self.login():
                        return None
                    self.page.goto(url, wait_until="networkidle")
                    time.sleep(2)

                if self.page.url == url or "/login" not in self.page.url:
                    navigated = True
                    break

            if not navigated:
                log("   ❌ Could not navigate to shipment creation page")
                return None

            # ── Step 2: Look for "New Shipment" or "Add" button ──
            # Click the create/add button if present
            add_btn_selectors = [
                'button:has-text("إضافة")',
                'button:has-text("شحنة جديدة")',
                'button:has-text("New")',
                'a:has-text("إضافة")',
                'a:has-text("شحنة جديدة")',
                '.btn-primary:has-text("إضافة")',
                'button:has-text("Add")',
                'button:has-text("Create")',
            ]

            for selector in add_btn_selectors:
                try:
                    btn = self.page.query_selector(selector)
                    if btn and btn.is_visible():
                        btn.click()
                        self.page.wait_for_load_state("networkidle")
                        time.sleep(2)
                        log(f"   ✅ Clicked create button: {selector}")
                        break
                except Exception:
                    continue

            # ── Step 3: Fill the shipment form ──
            # These selectors need to be calibrated on first run.
            # Common patterns for shipping forms:

            form_data = {
                "customerName": order.get("customerName", ""),
                "phone": order.get("phone", ""),
                "secondaryPhone": order.get("secondaryPhone", ""),
                "governorate": get_shipping_value(order.get("governorate", "")),
                "city": order.get("city", ""),
                "address": order.get("address", ""),
                "total": str(order.get("total", 0)),
                "notes": order.get("notes", ""),
                "items_description": ", ".join([
                    f'{item.get("productName", "?")} x{item.get("quantity", 1)}'
                    for item in order.get("items", [])
                ]),
            }

            # Try to fill each field using common selectors
            field_mappings = [
                # (field_key, possible_selectors)
                ("customerName", [
                    '#recipientName', '#recipient_name', '#customerName', '#name',
                    'input[name="recipientName"]', 'input[name="name"]',
                    'input[placeholder*="اسم"]', 'input[placeholder*="Name"]',
                    'input[placeholder*="المستلم"]',
                ]),
                ("phone", [
                    '#recipientPhone', '#phone', '#mobile', '#recipientMobile',
                    'input[name="phone"]', 'input[name="mobile"]',
                    'input[name="recipientPhone"]',
                    'input[placeholder*="هاتف"]', 'input[placeholder*="Phone"]',
                    'input[placeholder*="موبايل"]',
                ]),
                ("secondaryPhone", [
                    '#phone2', '#secondaryPhone', '#alternatePhone',
                    'input[name="phone2"]', 'input[name="alternatePhone"]',
                    'input[placeholder*="بديل"]', 'input[placeholder*="ثاني"]',
                ]),
                ("address", [
                    '#address', '#recipientAddress', '#streetAddress',
                    'input[name="address"]', 'textarea[name="address"]',
                    'input[placeholder*="عنوان"]', 'input[placeholder*="Address"]',
                    'textarea[placeholder*="عنوان"]',
                ]),
                ("city", [
                    '#city', '#district', '#area',
                    'input[name="city"]', 'input[name="district"]',
                    'input[placeholder*="مدينة"]', 'input[placeholder*="منطقة"]',
                    'input[placeholder*="City"]',
                ]),
                ("total", [
                    '#codAmount', '#cod', '#amount', '#cashOnDelivery',
                    'input[name="cod"]', 'input[name="amount"]',
                    'input[name="codAmount"]', 'input[name="cashOnDelivery"]',
                    'input[placeholder*="مبلغ"]', 'input[placeholder*="تحصيل"]',
                    'input[placeholder*="Amount"]',
                ]),
                ("items_description", [
                    '#contents', '#description', '#packageContents',
                    'input[name="contents"]', 'textarea[name="contents"]',
                    'input[name="description"]', 'textarea[name="description"]',
                    'input[placeholder*="محتوي"]', 'input[placeholder*="Content"]',
                    'textarea[placeholder*="محتوي"]',
                ]),
                ("notes", [
                    '#notes', '#remarks', '#comment',
                    'input[name="notes"]', 'textarea[name="notes"]',
                    'input[placeholder*="ملاحظ"]', 'textarea[placeholder*="ملاحظ"]',
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
