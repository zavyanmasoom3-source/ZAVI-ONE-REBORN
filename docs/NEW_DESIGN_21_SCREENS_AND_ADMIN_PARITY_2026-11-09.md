# ZAVI ONE / ADMIN — new design-to-source mapping (2026-11-09)

**Status: stage 0 source reconnaissance, not final visual parity.** Reference design: five supplied PDFs with 59 scanned pages plus the owner's 21 feature descriptions. Prior source mapping: [PDF_59_PAGE_TRACEABILITY.md](PDF_59_PAGE_TRACEABILITY.md). The PDFs contain design mockups, **not production data**. Any sample names, prices, phone numbers or product IDs in those screenshots must NEVER be seeded into the live app.

All status labels below were chosen conservatively based on existing source paths, previously captured real Chrome route screenshots, and the earlier PDF traceability matrix. `موجود` proves only a module or page exists; it does **not** certify end-to-end behavior. None of the 26 rows is marked complete.

| ردیف | طرح جدید | محل فعلی/سورس | وضعیت واقعی قبل | اقدام لازم پس از پایه مشترک |
|---|---|---|---|---|
| ۲-۱ | ورود | apps/one/index.html، تنظیمات ورود و PIN | جزئی؛ نمایش واقعی باید بررسی شود | حذف متن دوگانه، چشم رمز، زبان و اثرانگشت؛ تست در سه حالت |
| ۲-۲ | بازیابی رمز | index.html + zavi-store-recovery-v6594.js | جزئی؛ جریان واقعی تأیید نشده | فرم کوتاه + سه روش جمع‌شونده؛ تست حفاظت داده |
| ۲-۳ | داشبورد | route dashboard + zavi-pdf-screen-map-v6740.js | صفحه موجود؛ تطبیق ناقص | ترتیب هدر/کارت‌ها، داده واقعی، نرخ ارز، تاریخ و نمودار |
| ۲-۴ | کارت صندوق | route dashboard / money + cashBalances | محاسبات پایه؛ چندارزی تأیید نشده | تجزیه گردش واقعی هر ارز و دسترسی افتتاحیه |
| ۲-۵ | صندوق و جریان پول | route money | موجود؛ ساختار تب‌ها تأیید نشده | دریافت/پرداخت، حساب‌ها، تراکنش‌ها و بیشتر |
| ۲-۶ | فروش سه‌تب | route sales + zavi-warehouses-v1.js | موجود؛ سه‌تب و تراکنش کامل ناقص | اعتبارسنجی زیر فیلد، idempotency، نرخ/گدام/پرداخت چندگانه |
| ۲-۷ | فاکتور و چاپ | invoice.html، invoice-a5.html + zavi-message-center-v6720.js | پیش‌نمایش موجود؛ چاپ واقعی ناقص | کالای صفر/بی‌نام مسدود، Share Sheet، PDF و چاپگر واقعی |
| ۲-۸ | محصولات و گدام | route products + zavi-warehouses-v1.js + zavi-barcode-label-v6700.js | بخش‌ها موجود؛ دستگاه/سرور ناقص | موجودی مستقل، EAN/Code128 قابل اسکن، برچسب واقعی |
| ۲-۹ | مدیریت خرید | route purchases + zavi-warehouse-transfers-v1.js | رابط موجود؛ دریافت مرحله‌ای ناقص | چهار ورودی و سه‌تب، سفارش در راه، هزینهٔ تمام‌شده |
| ۲-۱۰ | تنظیمات تکمیلی خرید | route purchases و فرم‌های تکمیلی | تأیید سرتاسری نشده | اقساط، تاریخچه، تأیید خرید بزرگ، گزارش عددی |
| ۲-۱۱ | تنظیمات | route settings + zavi-final-settings-store-v6559.js | جستجو/گروه‌بندی موجود؛ ۸ گروه ناقص | مرتب‌سازی بدون حذف قابلیت، فونت/ارقام/دیزاین |
| ۲-۱۲ | اشتراک و دستگاه‌ها | cloud.js، زبانه‌های دستگاه و آفلاین | روال‌های پایه؛ دستگاه واقعی تأیید نشده | مالکیت، lease و انتقال بدون حذف صف |
| ۲-۱۳ | گزارش‌ها | route reports + journalNotes/tx | رابط موجود؛ اعتبار اعداد و فیلتر ناقص | سه‌تب، بازهٔ تاریخ و reconciliation |
| ۲-۱۴ | طلبات | route debtors + contacts/tx | بخش موجود؛ پیوند صندوق/واتساپ ناقص | قسط، بدهی هر ارز، پیام قابل ویرایش |
| ۲-۱۵ | دفترچه تماس | route phonebook + zavi-message-center-v6720.js | بخش موجود؛ پیام‌ها کامل تأیید نشده | ۹ قالب + ۵ احوال‌پرسی، E.164، بدون ارسال خودکار |
| ۲-۱۶ | قرض‌های ما | creditors/debt data in index.html | منطق پایه؛ جریان کامل تأیید نشده | افتتاحیه جدا از cash، پرداخت/دریافت، روزنامچه |
| ۲-۱۷ | روزنامچه | route journal | بخش موجود؛ موجودی هوشمند ناقص | معاملات واقعی، یادداشت مستقل، هر دو تاریخ |
| ۲-۱۸ | ضایعات | wasteRecords + zavi-manual-waste-v41.css | ثبت موجود؛ کاهش گدام تأیید نشده | گدام مقصد، فقط کاهش موجودی، بدون اثر ساختگی صندوق |
| ۲-۱۹ | همکاران | colleague permissions در index/cloud.js | رابط موجود؛ مجوز سروری تأیید نشده | فروش و خرید مستقل، سود پنهان، تست RLS |
| ۲-۲۰ | تجارت عمومی | فرم کسب‌وکار/اسناد در index.html | تطبیق تأیید نشده | سه‌بخش، سند مالی مستقل، جلوگیری از duplicate |
| ۲-۲۱ | حواله | route money و انتقال حساب‌ها | بخش موجود؛ اثر دوطرفه تأیید نشده | حواله/انتقال مجزا، مانده و ثبت روزنامچه |
| ADMIN-۱ | ورود و امنیت | apps/admin/index.html، app.js | موجود؛ parity سه‌حالته تأیید نشده | متن یک‌زبان، خطای زیر فیلد، جلسه و مجوز سرور |
| ADMIN-۲ | مشتریان و حذف/بازیابی | apps/admin/app.js، account-control.js | soft delete/restore موجود؛ تست staging ناقص | تأیید دوباره، audit، حذف دائمی جدا و مسدود |
| ADMIN-۳ | تمدید/اشتراک/دستگاه | apps/admin/app.js، renewal modules | موجود؛ UI و نقش‌ها جزئی | کارت کوچک، روال تمدید، محافظت admin/owner |
| ADMIN-۴ | گزارش و کنترل پرداخت | apps/admin/app.js و finance snapshot RPC | موجود؛ ارقام/مجوز تست نشده | سه‌زبانه، گزارش واقعی با نقش و تاریخ |
| ADMIN-۵ | تنظیمات و مدیریت همکاران | apps/admin/zavi-preferences-v2.js و app.js | موجود؛ parity و دسترسی ناقص | اجزای مشترک، گزارش امنیت، عدم افشای سود |

## One authoritative shared design layer

Use `packages/shared/ui/design-system-v1.css` and `design-system-v1.js` from **both** apps instead of creating another duplicated per-app theme. This layer is opt-in to preserve existing screen handlers and approved visual layouts, and exposes:
- AAA/AA-aware contrast theme palettes and core tokens for light/dark/glass; readable form errors, focus ring, RTL, compact cards, tabs and reduced motion.
- `formatDualDate` with Afghan Solar Hijri month names (حمل … حوت) and Gregorian date, `formatNumber` with consistent digit style, `formatExchangeRate` without reversed USD/AFN, `normalizeAfghanPhone` for +93 WhatsApp routing.
- Shared UI is presentation-only: **no** financial account writes, license bypass, sample dataset injection, or permissions modification.

## Exact acceptance gate after each group

1. Disposable fresh-browser screenshot per affected route at mobile viewport, language `fa-AF/ps-AF/en`, theme `light/dark/glass`. `routes smoke passes` is not `visual parity passes`.
2. Measure contrast using WCAG relative-luminance formula; normal text 4.5:1 and large text 3:1. For glass evaluate the actual blended background.
3. Check document `lang`, `dir`, any horizontal overflow, focus reachability, fields error position, no overlapping fixed bars, and no mixed-language labels.
4. Test business actions with synthetic ledger and isolated staging backend. Check no mock numbers from PDF appear as actual business data.
5. Run [migration-integrity](../.github/workflows/migration-integrity.yml) and [visual-qa](../.github/workflows/visual-qa.yml) at each merged commit, then physical Android/Windows QA.

**Unfinished:** 21/21 full form+backend+3-language/3-theme parity, 5/5 ADMIN parity, 59/59 pixel comparisons and accounting/Sync device acceptance. This file is a verified worklist, not completion proof.
