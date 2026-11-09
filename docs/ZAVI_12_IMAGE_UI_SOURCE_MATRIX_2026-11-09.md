# ZAVI ONE / ADMIN — 12-image design-to-source master matrix

**Date:** 2026-11-09 | **Repository:** `zavyanmasoom3-source/ZAVI-ONE-REBORN` | **Working branch:** `dev`.

These are 12 composite design sheets, each containing multiple individual screens. Image IDs I01–I12 refer to **the order the owner uploaded them in this conversation**, not PDF page numbers. The 59-page earlier PDF mapping remains a separate input. All visible names, telephone numbers, currency amounts, dates and fake charts in design images are examples only; **never seed them**.

**Evidence grading:** `S` = a source module or DOM route is located; `B` = disposable-browser smoke screenshot (see actions); `P` = same-viewport owner-reference pixel comparison *passed*; `E` = backend/physical-device acceptance *passed*. **No P or E is claimed here.**

## Image index

| Images | Distinct visual screens in the sheet |
|---|---|
| I01 | customers, contacts, customer details, WhatsApp, receivables, our debts, debt details, waste, add waste |
| I02 | login, recovery, dashboard, settings, appearance, subscription, devices, offline, backup, colleagues |
| I03 | dashboard and 3-step sale: customer, products, payment |
| I04 | products, warehouses, stock movements, barcode labels, purchase, purchase lists, invoice preview, printing |
| I05 | dark mode: splash, dashboard, sale, stock, customers, cash, remittance, journal, reports, settings, membership, colleagues |
| I06 | cash, accounts and banks, currency exchange, remittance, transfer, journal, financial reports, business profile |
| I07 | ADMIN device overview, registered devices, device details/transfer, offline requests/settings, audit, reports |
| I08 | ADMIN dashboard, customer management, subscription details and renewal |
| I09 | ADMIN dashboard, customer profile, outbound messages, WhatsApp message preview and confirmation |
| I10 | ADMIN dashboard, customers, activation, subscription, devices, offline licenses, communication, security, activity |
| I11 | ADMIN dashboard, manager profile, roles, access policies, event log, dark settings, subscriptions |
| I12 | ADMIN branding, dashboard, customer management, activation, devices, offline permission, communication, security and activity |

## Mapping and current state

| # | App | New reference screen | Existing route / module | Actual source location | Evidence & status | Sheets |
|---:|---|---|---|---|---|---|
| 1 | ZAVI ONE | Splash | `Splash / لوگو` | `apps/one/index.html; assets/ splash scripts` | **S only.** وضعیت نمایش: نیازمند عکس واقعی | I02,I05 |
| 2 | ZAVI ONE | ورود PIN/اثر انگشت | `ورود محلی و کد` | `apps/one/index.html; zavi-store-recovery-v6594.js` | **S only.** تست UI قبلی؛ اثر انگشت دستگاه نامعلوم | I02 |
| 3 | ZAVI ONE | بازیابی رمز | `فرم و روش‌های جایگزین` | `apps/one/zavi-store-recovery-v6594.js` | **S only.** عملکرد بازیابی کامل تأیید نشده | I02 |
| 4 | ZAVI ONE | داشبورد | `dashboard` | `apps/one/index.html renderDashboard(); zavi-approved-dashboard-v2.js` | **S only.** بازنویسی آغاز شده، تصویر نهایی تأیید نشده | I02,I03,I05,I06 |
| 5 | ZAVI ONE | فروش و فهرست فاکتورها | `sales / renderOrders` | `apps/one/index.html renderOrders(); zavi-approved-one-v2.css` | **S only.** تب و فیلتر موجود، تطبیق ناقص | I03,I05 |
| 6 | ZAVI ONE | فروش سه‌مرحله‌ای | `order modal` | `apps/one/zavi-compact-workflow-v1.js; index.html` | **S only.** مرحله‌بندی جزئی؛ تست جلوگیری از دوباره‌نویسی لازم | I03 |
| 7 | ZAVI ONE | فاکتور و چاپ | `invoice / print` | `apps/one/invoice.html; invoice-a5.html; index.html` | **S only.** چاپگر A4/A5/58/80mm واقعی آزموده نشده | I04 |
| 8 | ZAVI ONE | اشتراک‌گذاری/واتساپ | `message` | `apps/one/zavi-message-center-v6720.js` | **S only.** تأیید ارسال و ضمیمه در اندروید باقی | I01,I04 |
| 9 | ZAVI ONE | محصولات | `products` | `apps/one/index.html renderProducts(); zavi-warehouses-v1.js` | **S only.** فهرست واقعی، تطبیق صفحه کامل نیست | I04,I05 |
| 10 | ZAVI ONE | گدام‌های مستقل | `warehouse` | `apps/one/zavi-warehouses-v1.js` | **S only.** آزمایش انتقال/انبار مستقل کامل نشده | I04 |
| 11 | ZAVI ONE | حرکات موجودی | `movements` | `apps/one/zavi-warehouse-transfers-v1.js` | **S only.** قواعد حسابداری سرتاسری آزموده نشده | I04 |
| 12 | ZAVI ONE | اسکن و لیبل بارکد | `barcode labels` | `apps/one/zavi-barcode-label-v6700.js; zavi-zxing-offline-v1.js` | **S only.** سخت‌افزار اسکن/چاپ آزمایش نشده | I04 |
| 13 | ZAVI ONE | خرید و تأمین | `purchases` | `apps/one/index.html renderOrders('purchase')` | **S only.** منوی جدید موجود، تصویر مرجع ناقص | I04,I05 |
| 14 | ZAVI ONE | خرید جدید سه‌مرحله‌ای | `purchase form` | `apps/one/zavi-compact-workflow-v1.js; index.html` | **S only.** اعتبارسنجی مالی کامل تأیید نشده | I04 |
| 15 | ZAVI ONE | سفارش در راه/دریافت مرحله‌ای | `transit` | `apps/one/zavi-in-transit-v1.js` | **S only.** قرارداد تست دارد؛ دیتابیس آزمایشی لازم | I04 |
| 16 | ZAVI ONE | مشتریان/تأمین‌کنندگان | `contacts` | `apps/one/index.html renderContacts()` | **S only.** بازطراحی تفصیلی کامل نشده | I01,I05 |
| 17 | ZAVI ONE | جزئیات مشتری/صورت‌حساب | `customer details` | `apps/one/index.html; zavi-message-center-v6720.js` | **S only.** مانده و دریافت نیازمند تست عددی | I01 |
| 18 | ZAVI ONE | دفترچه تماس | `phonebook` | `apps/one/index.html; zavi-message-center-v6720.js` | **S only.** شماره E.164 و RTL نیازمند بررسی | I01 |
| 19 | ZAVI ONE | طلبات | `debtors` | `apps/one/index.html renderDebtors()` | **S only.** تطبیق مرجع و کارکرد وصول ناقص | I01 |
| 20 | ZAVI ONE | قرض‌های ما | `creditors` | `apps/one/index.html renderCreditors()` | **S only.** ثبت/پرداخت قرض نیازمند reconciliation | I01,I05 |
| 21 | ZAVI ONE | ضایعات و ثبت ضایعات | `waste` | `apps/one/index.html renderWaste()` | **S only.** اثر گدام باید در staging اثبات شود | I01 |
| 22 | ZAVI ONE | صندوق نقدی | `cash` | `apps/one/index.html renderMoney()` | **S only.** چندارزی و افتتاحیه نیازمند تست | I06,I05 |
| 23 | ZAVI ONE | حساب‌ها و بانک‌ها | `money accounts` | `apps/one/index.html renderMoney()` | **S only.** طرح و موجودی چندارزی تأیید نشده | I06 |
| 24 | ZAVI ONE | ارزها و نرخ‌ها | `FX rates` | `apps/one/index.html; shared design helpers` | **S only.** فهرست ISO/نرخ دستی نیازمند تست | I06 |
| 25 | ZAVI ONE | حواله و انتقال | `hawala` | `apps/one/index.html renderHawala()` | **S only.** اتمیک/ثبت مالی در staging بررسی شود | I06 |
| 26 | ZAVI ONE | روزنامچه | `journal` | `apps/one/index.html renderJournal()` | **S only.** فیلتر و جمع مالی سرتاسری ناقص | I05,I06 |
| 27 | ZAVI ONE | گزارش‌ها | `reports` | `apps/one/index.html renderReports()` | **S only.** PDF/Excel و صحت عددی نیازمند تست | I06 |
| 28 | ZAVI ONE | مشخصات تجارت | `business` | `apps/one/v25-business.html; index.html` | **S only.** فرم واقعی، تطبیق جدید ناقص | I06 |
| 29 | ZAVI ONE | تنظیمات/ظاهر | `settings` | `apps/one/index.html renderSettings(); zavi-preferences-v2.js` | **S only.** سه حالت تازه در سیستم مشترک فعال؛ صفحه نه | I02,I05 |
| 30 | ZAVI ONE | اشتراک و دستگاه | `subscription` | `apps/one/index.html; cloud.js` | **S only.** واقعی بودن lease/انتقال دستگاه تأیید نشده | I02 |
| 31 | ZAVI ONE | حسابداری آفلاین/Sync | `offline` | `apps/one/cloud.js; sw.js; offline-check.html` | **S only.** تست روی دستگاه/سرور لازم | I02 |
| 32 | ZAVI ONE | همکاران/مجوزها | `staff` | `apps/one/index.html; cloud.js` | **S only.** RLS کاربر غیرمالک باید در staging تست شود | I02,I05 |
| 33 | ZAVI ONE ADMIN | داشبورد مدیریت | `overview` | `apps/admin/app.js renderOverview()` | **S only.** چهار KPI بازسازی شده؛ تطبیق نهایی ناقص | I07,I08,I11,I12 |
| 34 | ZAVI ONE ADMIN | مدیریت مشتریان | `customers` | `apps/admin/app.js renderCustomers()` | **S only.** جستجو/فیلتر، تعداد و صفحه‌بندی نیازمند QA | I08,I09,I10,I11,I12 |
| 35 | ZAVI ONE ADMIN | جزئیات مشتری | `customer details` | `apps/admin/app.js; account-control.js` | **S only.** مدیریت داده و کنترل دسترسی سروری نیازمند staging | I08,I09 |
| 36 | ZAVI ONE ADMIN | فعال‌سازی و تمدید | `payments` | `apps/admin/app.js renderPayments(); renewal scripts` | **S only.** پرداخت/تمدید واقعی نیازمند staging | I08,I10,I12 |
| 37 | ZAVI ONE ADMIN | دستگاه‌ها | `devices` | `apps/admin/app.js renderDevices()` | **S only.** ظاهر و دسترسی نیازمند تست دستگاه | I07,I10,I12 |
| 38 | ZAVI ONE ADMIN | انتقال دستگاه اصلی | `device transfer` | `apps/admin/device transfer modules; app.js` | **S only.** عملیات سروری با مالکیت و rollback تأیید نشده | I07 |
| 39 | ZAVI ONE ADMIN | مجوز آفلاین | `offline license` | `apps/admin/app.js; offline permissions modules` | **S only.** RLS و lease سروری آزموده نشده | I07,I10 |
| 40 | ZAVI ONE ADMIN | ارتباط و پیام‌ها | `support` | `apps/admin/app.js renderSupport(); messaging modules` | **S only.** WhatsApp/ویرایش و لاگ نیازمند QA | I09,I10 |
| 41 | ZAVI ONE ADMIN | امنیت، نقش‌ها و دسترسی‌ها | `security` | `apps/admin/app.js renderSecurity()` | **S only.** اجبار سمت سرور و نقش‌های چندسطحی تأیید نشده | I11,I12 |
| 42 | ZAVI ONE ADMIN | تاریخچه عملیات | `activity` | `apps/admin/app.js renderActivity()` | **S only.** ثبت IP و audit کلی نیازمند backend QA | I07,I10,I11,I12 |
| 43 | ZAVI ONE ADMIN | گزارش‌ها و مالی | `finance` | `apps/admin/app.js renderFinance()` | **S only.** ساختار کنترل مالی و RLS تأیید نشده | I08,I09 |
| 44 | ZAVI ONE ADMIN | پروفایل مدیر | `profile` | `apps/admin/index.html; app.js; settings modules` | **S only.** UI موجود، تطبیق و ذخیره واقعی بررسی شود | I11 |
| 45 | ZAVI ONE ADMIN | تنظیمات سیستم | `settings` | `apps/admin/app.js renderSettings(); zavi-admin-settings-hub-v1.js` | **S only.** ساختار موجود، سه حالت و زبان بررسی شود | I07,I10,I11 |

## Core functional preservation contract

Keep real sale/purchase validation, invoice numbering, multiwarehouse movements, offline outbox/idempotency, cloud Sync, Supabase RLS, owner-only admin, WhatsApp handoff, trial/renewal, cheque/ledger reconciliation, and device transfer. Any route missing from the 12 screenshots must appear in **More** or accessible collapsed settings; a visual rewrite cannot delete account records, underlying business commands, permission checks, or old audit history.

## Design foundation implementation

- **One palette:** `packages/shared/ui/design-system-v1.css`; `zavi-reference-v3.css` now only maps old variable names onto this single palette.
- **Three appearance states:** `light`, `dark`, `glass` via each app's `zavi-theme-v29.js`. Glass uses opaque-enough tinted surfaces for accessible foreground text; do not certify without actual computed-browser contrast.
- **Grid:** multiples of 4/8px, minimum 44px controls, 12–20px radius, safe-area support.
- **Shared behavior:** `packages/shared/ui/design-system-v1.js` — language, digits, Afghan dual dates, phone normalization, field errors. No database or network logic here.
- **Font:** `Vazirmatn` is **not yet physically bundled** in this GitHub repository. CSS includes offline system fallbacks. Local font embedding and complete Pashto glyph audit remain **BLOCKED / unverified**, not a finished feature.
- **Icons:** unified monochrome line icon primitives are implemented for future route migration; many old route icons still need replacement.
- **Existing business routes:** no user data or Supabase schema changed in this phase.

## Acceptance and evidence (as of mapping)

- Visual/browser route evidence: [REBORN PDF visual QA](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/workflows/visual-qa.yml). The screenshots are saved for seven days as artifacts, **not proof** of perfect reference parity.
- Integrity/functional smoke: [GitHub Actions](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions). These do **not** simulate real barcode printers, live Supabase owner/staff tenants or an actual Android device.
- Mapping coverage: **45/45 planned screen groups identified**. Screen groups may contain multiple subpages.
- Pixel parity **0 certified**; end-to-end server permission acceptance **0 certified** in this phase; Windows installer **not built**.
- No migrations/backups were performed: this phase intentionally makes **zero database writes**.
- Release signing Secrets are still the owner's responsibility and must not be committed to a public repo.

## Release gates

1. Verify each reference with identical viewport/density/locale/theme and actual rendered production route; use screenshot diff / human review and record per-row P results.
2. Verify real forms (invalid/valid, duplicate, currency, inventory, transit, offline) with isolated fixtures.
3. Exercise server RLS, audit, soft deletion, subscription/lease and device transfer only on **staging with backups and rollback**.
4. Verify each language and numbers in light/dark/glass, all 44px controls, RTL/LTR, safe areas, font glyphs, screen readers and no obstructive floating launchers.
5. Verify print/WhatsApp intent, QR scanners, biometrics, Redmi Android 8–16 and Windows installer with actual hardware.
6. Package new APKs with `TEST-NOT-FOR-RELEASE` label; do not claim Release until permanent signing key secrets are configured and verified.

**Not completed:** Pixel-perfect page migration, local Vazirmatn font asset, live staged RLS/ledger QA, Android physical QA, Windows install QA, and final signed release. No fake ready status is allowed.
