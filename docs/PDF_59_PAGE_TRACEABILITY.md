# ZAVI ONE — 59-page PDF requirements traceability (read-only evidence, 2026-11-08)

Source: user-supplied five PDFs, 11 + 12 + 12 + 12 + 12 = **59 scanned image pages**. Each page was rendered and visually inspected as a contact sheet. The photographs often combine proposed UI screenshots with chat instructions, so they are not 59 independently running screens. No OCR-only extrapolation was used.

**Evidence policy:** `رابط موجود` means only the relevant source file exists, NOT proof of complete behavior. `تست پایه` means the limited browser test passed, NOT physical-device certification. `تأیید نشده` means no passing evidence was found. No row is marked release-ready without relevant Android and financial integration evidence.

| ردیف | PDF | صفحه | عنوان/قابلیت | فایل متناظر سورس | وضعیت فعلی | اقدام الزامی |
|---:|---:|---:|---|---|---|---|
| 1 | 1 | 1 | فروش جدید / کارت‌های اصلی | `index.html`, `zavi-pdf-screen-map-v6740.js` | رابط موجود؛ جریان کامل تأیید نشده | ثبت فروش با موجودی و بارکد آفلاین روی دستگاه |
| 2 | 1 | 2 | فرم فروش و انتخاب مشتری | `index.html` | رابط موجود؛ جریان کامل تأیید نشده | تست مشتری، انبار، قیمت و ویرایش اقلام |
| 3 | 1 | 3 | دریافت وجه و بدهی فروش | `index.html` | تست پایه؛ ناقص | تست پرداخت چندحسابی و چندارزی |
| 4 | 1 | 4 | پیش‌نمایش سند فروش | `index.html`, `invoice.html` | رابط موجود؛ دستگاه تأیید نشده | چاپ و اشتراک‌گذاری واقعی |
| 5 | 1 | 5 | افزودن دستی محصول در فروش | `index.html` | تست بارکد مجزا؛ ناقص | فروش محصول بدون بارکد و افزایش تعداد |
| 6 | 1 | 6 | شرح گردش فروش و اسکن | `zavi-zxing-offline-v1.js`, `index.html` | بخشی پیاده؛ دستگاه تأیید نشده | دوربین جلو و عقب، تکرار اسکن و آفلاین |
| 7 | 1 | 7 | نمای عمومی فروش سریع | `index.html`, `zavi-pdf-final-v6760.css` | طرح نسبی؛ تطبیق بصری تأیید نشده | مقایسه اسکرین‌شات موبایل با مرجع |
| 8 | 1 | 8 | جست‌وجو و بارکد کالا | `index.html`, `zavi-zxing-offline-v1.js` | تست کدگذاری؛ کارکرد دستگاه تأیید نشده | دوربین، مجوز، انتخاب کالا |
| 9 | 1 | 9 | فاکتور فروش با بارکد | `index.html`, `invoice.html` | رابط موجود؛ ناقص | ثبت واقعی و جمع‌بندی |
| 10 | 1 | 10 | دستورالعمل اصلاحات فروش | `index.html` | توضیح نیازمندی؛ نه صفحه مستقل | بررسی موارد کاربردی فروش |
| 11 | 1 | 11 | جمع‌بندی طراحی فروش و خروجی | `index.html`, `invoice.html` | توضیح نیازمندی؛ نه صفحه مستقل | پوشش تست نهایی فروش |
| 12 | 2 | 1 | ورود اختصاصی و PIN | `index.html` | ورود مرورگر تست شده؛ ناقص | Android biometric/PIN و بازیابی |
| 13 | 2 | 2 | ورود روشن و ساده | `index.html`, `zavi-reborn-design-v1.css` | اسکرین‌شات QA؛ تطبیق تأیید نشده | کنتراست، چرخش و صفحه‌کلید |
| 14 | 2 | 3 | داشبورد اصلی و عملیات سریع | `index.html`, `zavi-pdf-screen-map-v6740.js` | تست مرورگر؛ ناقص | نمودارها با داده‌های واقعی |
| 15 | 2 | 4 | داشبورد، نرخ ارز، اقلام کمبود | `index.html` | رابط موجود؛ محاسبات کامل تأیید نشده | نرخ دستی، فروش ماهانه، موجودی |
| 16 | 2 | 5 | خلاصه صندوق نقدی | `index.html` | تست حساب‌های پایه موفق؛ ناقص | تطبیق نقد چندارزی |
| 17 | 2 | 6 | بدهی‌ها و ماندهٔ صندوق | `index.html` | تست پایه بدهی موفق؛ ناقص | تسویه، بازپرداخت و ارز جدا |
| 18 | 2 | 7 | محصولات و گدام‌ها | `index.html`, `zavi-warehouses-v1.js` | رابط موجود؛ سرور تأیید نشده | چندگدام مستقل و موجودی سرور |
| 19 | 2 | 8 | فهرست محصولات و فیلترها | `index.html`, `zavi-warehouses-v1.js` | رابط موجود؛ ناقص | جست‌وجو، فیلتر و CSV |
| 20 | 2 | 9 | ساخت لیبل بارکد | `zavi-barcode-label-v6700.js` | کد بارکد تست شده؛ چاپ واقعی تأیید نشده | انتخاب کالا، سایز و تعداد |
| 21 | 2 | 10 | پیش‌نمایش Code128 | `zavi-barcode-label-v6700.js` | تست الگوریتم موفق؛ دستگاه تأیید نشده | چاپ حرارتی و شفافیت |
| 22 | 2 | 11 | خانهٔ خرید جدید | `index.html`, `zavi-pdf-screen-map-v6740.js` | رابط موجود؛ ناقص | انتخاب نوع خرید و انتقال |
| 23 | 2 | 12 | چهار گزینهٔ خرید و سفارش | `index.html`, `zavi-warehouse-transfers-v1.js` | جریان کامل تأیید نشده | داخلی/خارجی/راه/برگشت |
| 24 | 3 | 1 | انتخاب نوع خرید | `index.html` | رابط جزئی؛ ناقص | چهار مسیر واقعی |
| 25 | 3 | 2 | فرم خرید ساده | `index.html` | رابط موجود؛ ناقص | ثبت و ذخیرهٔ فاکتور |
| 26 | 3 | 3 | مرور و تغییر مسیر خرید | `index.html` | توضیح نیازمندی؛ نه صفحه مستقل | تست رفت‌وبرگشت و حفظ داده |
| 27 | 3 | 4 | گزینه‌های خرید خارجی و در راه | `index.html`, `zavi-warehouse-transfers-v1.js` | پیاده‌سازی سرتاسری تأیید نشده | مراحل سفارش، گمرک و رسید |
| 28 | 3 | 5 | ثبت خرید جدید | `index.html` | رابط موجود؛ ناقص | جمع موجودی، پرداخت و بدهی |
| 29 | 3 | 6 | داشبورد سفارش‌های در راه | `index.html` | تأیید نشده | ثبت سفارش بدون افزایش موجودی |
| 30 | 3 | 7 | پیشرفت تحویل کالا | `index.html`, `zavi-warehouse-transfers-v1.js` | تأیید نشده | دریافت مرحله‌ای بدون ثبت تکراری |
| 31 | 3 | 8 | فهرست خریدهای در راه | `index.html` | تأیید نشده | فیلتر وضعیت سفارش |
| 32 | 3 | 9 | جزئیات سفارش در راه | `index.html` | تأیید نشده | رسید مرحله‌ای و تاریخچه |
| 33 | 3 | 10 | خرید خارجی؛ کشور و ارز | `index.html` | بخشی در سورس؛ ناقص | کشور آزاد، ISO4217 و نرخ ذخیره |
| 34 | 3 | 11 | کالا و هزینه‌های خرید خارجی | `index.html` | بخشی در سورس؛ ناقص | حمل، گمرک، نرخ و مانده |
| 35 | 3 | 12 | قوانین خرید خارجی و کالا در راه | `index.html` | توضیح نیازمندی؛ نه صفحه مستقل | تطبیق هر قانون با تست سناریو |
| 36 | 4 | 1 | فاکتور خرید ساده | `index.html` | رابط موجود؛ ناقص | داده حسابداری و پرداخت |
| 37 | 4 | 2 | سررسید و نوع پرداخت خرید | `index.html` | رابط موجود؛ ناقص | پرداخت نقدی/قرضی/ترکیبی |
| 38 | 4 | 3 | اقلام خرید و جمع هزینه | `index.html` | رابط موجود؛ ناقص | گردکردن و مانده |
| 39 | 4 | 4 | تنظیمات دسته‌بندی‌شده (تیره) | `index.html`, `zavi-preferences-v2.js`, `zavi-reborn-design-v1.css` | تست تصویری؛ تطبیق دقیق تأیید نشده | بازبینی اندازه/سه حالت |
| 40 | 4 | 5 | پرداخت و تخفیف خرید | `index.html` | رابط موجود؛ تست عددی کامل نشده | تخفیف، مانده و سررسید |
| 41 | 4 | 6 | فاکتور خرید جمع‌وجور | `index.html` | رابط موجود؛ ناقص | نمایش روی دستگاه |
| 42 | 4 | 7 | پیش‌نمایش فاکتور فروش A4 | `invoice.html`, `zavi-invoice-manual-v6527.js` | چاپ واقعی تأیید نشده | A4 و رنگ/راست‌چین |
| 43 | 4 | 8 | انتخاب PDF، A5 و حرارتی | `invoice-a5.html`, `index.html` | در سورس موجود؛ دستگاه تأیید نشده | چاپگر 58/80mm |
| 44 | 4 | 9 | واتساپ و فرستادن فاکتور | `zavi-message-center-v6720.js`, `index.html` | پیام متنی تست شده؛ فایل تأیید نشده | پیوست PDF/عکس با share intent |
| 45 | 4 | 10 | پیش‌نمایش چاپ موبایل | `invoice.html` | رابط موجود؛ دستگاه تأیید نشده | A4/A5 و دکمه بستن |
| 46 | 4 | 11 | تأیید فرستادن فایل در واتساپ | `zavi-message-center-v6720.js` | پیوست واقعی تأیید نشده | واتساپ معمولی/تجارتی |
| 47 | 4 | 12 | صندوق پول و جریان نقد | `index.html` | تست مانده پایه موفق؛ ناقص | چند صندوق و چند ارز |
| 48 | 5 | 1 | حواله پول (ثبت و انتقال) | `index.html` | جریان کامل تأیید نشده | رسید، کارمزد و حساب مقصد |
| 49 | 5 | 2 | حواله و پرداخت مشتری | `index.html` | جریان کامل تأیید نشده | مبلغ، ارز و مانده |
| 50 | 5 | 3 | جزئیات صندوق و جریان (تیره) | `index.html` | تست بصری؛ تست عددی محدود | مانده و تاریخ شمسی/میلادی |
| 51 | 5 | 4 | خلاصه حساب‌ها و تنظیمات صندوق | `index.html`, `zavi-preferences-v2.js` | تست بصری؛ ناقص | تغییر صندوق و حساب |
| 52 | 5 | 5 | داشبورد قرضداران | `index.html` | تست پایه بدهی؛ ناقص | گردش واقعی و تاریخچه |
| 53 | 5 | 6 | فهرست قرضداران و مانده | `index.html` | رابط موجود؛ ناقص | فیلتر و پرداخت |
| 54 | 5 | 7 | درخواست و پیام واتساپ به بدهکار | `index.html`, `zavi-message-center-v6720.js` | متن تست شده؛ تصویر تأیید نشده | یادآوری زمان‌دار و رسید |
| 55 | 5 | 8 | مجوزهای همکار در فروش و خرید | `index.html`, `cloud.js` | مجوز سروری سرتاسری تأیید نشده | کاربر غیرمجاز و RLS |
| 56 | 5 | 9 | فاکتورهای ثبت‌شده (تیره) | `index.html` | رابط موجود؛ ناقص | فاکتور فروش/خرید و CSV |
| 57 | 5 | 10 | مدیریت همکاران و نقش‌ها | `index.html`, `cloud.js` | بخشی موجود؛ ناقص | فروش/خرید و پنهان‌کردن سود |
| 58 | 5 | 11 | ثبت ژورنال عمومی | `index.html` | سند حسابداری کامل تأیید نشده | برابری بدهکار/بستانکار |
| 59 | 5 | 12 | فرم ثبت سند ژورنال | `index.html` | تست عملی کامل نشده | سند دوبل، تاریخ و تکرارناپذیری |

## Coverage summary
59/59 source pages indexed and mapped to existing source files; **0/59 can honestly be certified pixel-and-behavior complete** without expected visual targets, a physical Android/Windows runtime, and successful transaction/printing scenarios. This mapping is a work plan and does not alter the approved user-facing appearance.

## Remaining gates
1. Photograph / screenshot comparison at same device viewport, density, RTL and theme; verify not just an isolated CSS overlay.
2. Sale: camera, payment split, warehouse negative-stock prevention and local persistence.
3. Purchase: in-transit orders, partial acceptance, FX/customs allocations and idempotent stock update.
4. Cash: separated currencies, multiple accounts, accounting journal reconciliation.
5. Invoice: image/PDF attachment, real Android print/WhatsApp and close behavior.
6. Device transfer and staff permissions on a disposable authenticated two-tenant database and real device.

Never label the product complete using these document mappings alone.
