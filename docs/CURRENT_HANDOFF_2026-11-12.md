# ZAVI ONE / ZAVI ONE ADMIN — CONTINUATION HANDOFF (2026-11-12)

> **این فایل مرجع شروع چت بعدی است، نه گواهی انتشار.** فقط وضعیت و شواهدی که واقعاً در GitHub خوانده شده‌اند ثبت شده‌اند. برای وضعیت جدید ابتدا head شاخه `dev` را دوباره بررسی کنید.

## 1. مخزن مبنا و محدودهٔ کار
- مخزن اصلی فعال: `zavyanmasoom3-source/ZAVI-ONE-REBORN`.
- شاخهٔ اجرایی: `dev`.
- آخرین head پیش از ثبت این سند: `d8e7d0e2e9e62d66c92b26ddd02547bda78006d8` (2026-11-12 07:31:56 UTC).
- مخازن دیگر `Zavione` و `ZAVI-ONE-UNIFIED` وجود دارند، اما بدون تصمیم صریح و اثبات همگام‌بودن، سورس آنها جایگزین این شاخه نشود.
- هدف: ZAVI ONE + ZAVI ONE ADMIN، حفظ تمام عملکردهای تأییدشده؛ هیچ APK قدیمی یا Test را به عنوان نسخهٔ جدید معرفی نکنید.

## 2. تصمیم‌های غیرقابل نقض
1. طراحی مورد تأیید مالک و داده‌های مشتری را حفظ کنید. ماژول‌های حسابداری (فروش، خرید، چک، صندوق، طلبات/بدهی‌ها، چندارزی)، گدام مستقل، بارکد، WhatsApp، آفلاین/Sync و مجوزها را بدون ممیزی و تست حذف یا بازنویسی نکنید.
2. دری افغانستان / پشتو / انگلیسی و نمایش دو تاریخ هجری‌شمسی و میلادی حفظ شوند.
3. Supabase محیط واقعی است. در این مرحله **هیچ نوشتن/مهاجرت/پاک‌سازی داده** انجام نشده است. فقط بررسی عمومی اتصال Auth در CI PASS گزارش شده است؛ این به معنی تأیید همهٔ RLS یا نوشتن حسابداری در تولید نیست.
4. ترتیب کار: یک مشکل در یک زمان؛ فقط پس از اصلاح واقعی و شواهد کافی سراغ مشکل بعدی بروید.
5. مالک در آخرین گفت‌وگو دستور داد تا قبل از برطرف‌شدن همهٔ مشکلات **APK جدید ساخته یا ارسال نشود**؛ حتی QA نباید «نهایی» نامیده شود. حذف برنامهٔ قدیمی یا دادهٔ مشتری ممنوع است.
6. هیچ فایل Keystore، کلید خصوصی، رمز، Service Role یا Token را در چت، Issue، commit یا مخزن عمومی درج نکنید.

## 3. آخرین مسئلهٔ UI از گفت‌وگوهای پروژه
- مالک دو ایراد را اعلام کرد: نمایش اشتباه ماه/سال و تقویم و به‌هم‌ریختگی/گیرکردن بخش بالایی داشبورد، همراه خواستهٔ تقویم گرافیکی و انیمیشن زنده.
- در تاریخ 2026-11-12 تغییرات مرتبط شامل ابعاد header در حالت Landscape، تقویم فروش گرافیکی، سبک موشن و بازنشانی cache با کامیت‌های `31d64f9`, `15561e85`, `e55326fe`, `9ddb473f`, `d8e7d0e2` در `dev` ثبت شده‌اند.
- **شواهد تازهٔ Dashboard QA (2026-11-12):** اجرای [Owner original APK style visual QA / 43175951381](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43175951381) در SHA `d8e7d0e2` موفق بوده است. Job `screenshot` تست مرورگری داشبورد، تقویم‌های شمسی/میلادی، برچسب‌های ماه/سال، سه تم، انیمیشن و حالت کاهش حرکت را PASS کرده است. لاگ `MOBILE_DASHBOARD_GEOMETRY` برای 320، 360، 393 و 430 پیکسل عرض، ارتفاع کارت خوشامدگویی را حدود **191px** نشان می‌دهد؛ در 700px افقی حدود **149px** است. اینها اندازه‌گیری مرورگرند و ارتفاع پیشین 280px صرفاً در گزارش مالک آمده است؛ نباید با تست روی دستگاه یکی دانسته شود.
- **وضعیت:** مشکل قبلی داشبورد در سطح **کد و تست خودکار مرورگر رفع/تأیید شده**؛ آزمون گوشی واقعی، نصب و پذیرش نهایی در دستگاه **ثبت/اثبات نشده**. این مسئله را تا یافتن خطای تازه دوباره طراحی نکنید و آن را 100% قابل انتشار ننامید.

## 4. تنها مانع انتخاب‌شده در این مرحله: امضای ثابت QA
- Issue پیگیری: https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/issues/3
- اجرای GitHub Actions: https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43175951271
- نتیجه: `failure` برای Jobهای Android ONE و Android ADMIN، هر دو پیش از راه‌اندازی Android SDK/Gradle.
- گام شکست‌خورده: `Require persistent per-app QA certificate (no debug fallback)`.
- در لاگ Runner، چهار ورودی امضا برای هر برنامه **خالی** است. این فقط نشان‌دهندهٔ فقدان مقدار مؤثر در Runner است؛ نمی‌توان مستقل نتیجه گرفت که صفحهٔ Settings فاقد Secret است.
- اسکریپت `scripts/prepare-ci-signing.py` به‌درستی fail-closed عمل کرده است؛ استفاده از امضای موقت برای عبور از تست امن نیست.
- فایل `signing/certificates.json` گواهی‌های عمومی برای ONE و ADMIN را جداگانه پین می‌کند.
- نام‌های اصلی Secrets: ONE = `ZAVI_KEYSTORE_BASE64`, `ZAVI_KEYSTORE_PASSWORD`, `ZAVI_KEY_ALIAS`, `ZAVI_KEY_PASSWORD`; ADMIN = `ADMIN_KEYSTORE_BASE64`, `ADMIN_KEYSTORE_PASSWORD`, `ADMIN_KEY_ALIAS`, `ADMIN_KEY_PASSWORD`. نام‌های Legacy هم در Workflow پذیرفته‌اند.
- راهنمای امن موجود: `docs/OWNER_SIGNING_SECRETS_AND_SAFE_UPGRADE_DARI.md`.
- لینک تنظیمات خصوصی: https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/settings/secrets/actions
- اگر کلید متناظر با اثرانگشت پین‌شده موجود نیست، بدون تصمیم رسمی دربارهٔ هویت/مهاجرت جدید، اثرانگشت را عوض نکنید و کلید تازه را جایگزین کلید قبلی جا نزنید.
- **وضعیت مانع:** باز / نیازمند مواد امضای امن؛ در این مرحله هیچ کلید یا رمز مخفی در دسترس ابزارهای توسعه نبوده است.

## 5. آخرین تست‌های قابل استناد (همان head پیش از این سند)
- https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43175951276 — `success`، هر ۶ Job:
  - accounting-and-admin
  - themes-and-locales
  - R8 unsigned Android one
  - R8 unsigned Android admin
  - Windows WebView2 x64 one compile
  - Windows WebView2 x64 admin compile
- https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43175951147 — `success`، transit و transit-postgres.
- در اجرای ناموفق 43175951271 پیش از مانع امضا، آزمون‌های امنیت سورس، Migration، offline shell، navigation، JavaScript syntax، health check عمومی Supabase، Stage 6 و Stage 7 موفق بودند.
- این نتایج **هیچ‌یک** تأیید APK امضاشده، ارتقای روی گوشی واقعی یا کل سیستم مالی تولید نیستند.

## 6. معیار عبور از مانع و آغاز مرحلهٔ بعد
- دو Keystore معتبر و متمایز باید در Actions Secrets با رمز و Alias صحیح در دسترس Runner باشند و با fingerprints ثبت‌شده سازگار باشند.
- هر دو Job مربوط به signed-QA PASS شوند و `apksigner` امضای v1/v2/v3، certificate و provenance را تأیید کند.
- دو اجرای متوالی با versionCode افزایشی و هویت ثابت، همراه تست نصب و ارتقا روی دستگاه **آزمایشی بدون اطلاعات واقعی** لازم است.
- قبل از انجام این موارد: **BLOCKED**. مرحلهٔ بعد از نظر اجرا هنوز شروع نشده است.

## 6A. تغییر تأییدشدهٔ فروش یک‌صفحه‌ای و چهار روش اسکن — 2026-11-12
- تأیید صریح مالک در گفت‌وگو: فاکتور فروش در **یک صفحه** باشد، چهار روش بارکد «دوربین، دستی، USB، Bluetooth» و افزودن خودکار با اسکن تکراری داشته باشد. نمونهٔ تعاملی پیش از اجرا پذیرفته شد.
- کامیت‌های کد واقعی در `dev`: [98344597](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/commit/983445970e134914cf150a374612a71454d98b67) (ماژول/UI اسکن و تست)، [aa123a6e](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/commit/aa123a6e9996ca9e3b26e2038f16ba478b35c19b) (حفظ ترتیب محافظت‌شدهٔ CSS)، [689eeb8d](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/commit/689eeb8d12c414da9fa079a95643234deba93642) (فوکوس مجدد HID بعد از Enter/Tab و تست آن).
- فایل تازهٔ مخصوص فروش: `apps/one/zavi-sale-scanner-modes-v6662.js` و `.css`. فقط روی `#dialogForm[data-zavi-sale-onepage="true"]` نصب می‌شوند؛ فاکتورهای خرید، برگشت، ADMIN و دیتابیس بدون تغییر مانده‌اند.
- چهار گزینهٔ قابل انتخاب، راهنمای دری/پشتو/English، ورود دستی، دکمهٔ دوربین واقعی موجود، USB/OTG HID و Bluetooth HID با ورود مانند کیبورد، افزودن خودکار قابل خاموش‌کردن، پردازش Enter و Tab و بازگرداندن فوکوس به کدخوان برای اسکن پشت‌سرهم. همهٔ شناسه‌ها و handlerهای native ثبت، قیمت، گدام و موجودی حفظ شده‌اند.
- **شواهد واقعی:** [Owner original APK style visual QA 43190727242](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43190727242) برای کامیت `689eeb8d` به‌طور کامل **SUCCESS**. مرحلهٔ `Verify approved one-page sale, typed unit price, barcode repeat and safe submission` موفق است؛ آزمون `scripts/test-v6662-sale-onepage-browser.py` حالات UI، جلوگیری از افزودن با auto-off، دو suffix رایج HID و تداوم فوکوس را بررسی می‌کند. [Migration integrity 43190727196](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43190727196) نیز **SUCCESS**.
- **محدودیت:** این تست‌ها مرورگر/آفلاین آزمایشی‌اند. اتصال فیزیکی اسکنر USB یا Bluetooth و دوربین/برنامه روی تلفن Android واقعی، عملکرد HID برندهای مختلف و ارتقای یک APK امضاشده **هنوز آزموده نشده**. Bluetooth SPP یا دستگاه‌های غیر-HID در این ماژول پیاده نشده‌اند و نباید پشتیبانی‌شده معرفی شوند.
- اجرای `REBORN clean Android QA builds` همان کامیت همچنان به‌دلیل نبود Secrets گواهی پایدار **FAIL** می‌شود؛ Issue #3 باز است. هیچ APK نهایی صادر یا تحویل نشده است.
- **مرحلهٔ بعد فقط پس از تصمیم مالک/آزمون لازم:** حفظ همین طرح و رفع مانع Signing یا بررسی مشکل تازه بر اساس عکس؛ بدون ادعای صددرصد برای سخت‌افزار واقعی.

## 6B. تأیید کاربر و اجرای واقعی ثبت محصول ۲۱ کسب‌وکار — 2026-11-12
- مالک **نمونهٔ تعاملی یک‌صفحه‌ای** ثبت محصول را تأیید و درخواست اجرای واقعی داد: **۲۱ تجارت، فیلدهای اختصاصی، دسته‌بندی، بارکد و SKU خودکار/دستی، دوربین، تایپ، USB/HID، Bluetooth HID، USD با نرخ دستی، انتخاب گدام و مشخصات رنگ/وزن/IMEI**.
- اجرای اصلی از [f0ad3d31](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/commit/f0ad3d31e0df40eff95247d8ea74f534524ad6a8) شروع و با بهبودهای کُد/QA تا [4e77be92](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/commit/4e77be920f77f2a679ac84c8cf921da3615ed059) در `dev` ثبت شده است. از `apps/one/index.html`، `apps/one/zavi-product-adaptive-v6662.js`، `.css` و `zavi-camera-scan-v635.js` همراه service-worker و تست اصلی استفاده می‌شود. اصل UX موجود و همهٔ handlerهای ثبت و دفتر مالی حفظ شده‌اند.
- ۲۱ صنف **اصلِ** `ZaviIndustryForms6529` در فرم انتخاب‌پذیرند؛ نوع خاص *لوازم موبایل* هم با نام دقیق نمایش داده می‌شود. انتخاب محصول فقط draft همان محصول را تغییر می‌دهد؛ تنظیمات اصلی تجارت بدون ذخیره و تأیید مالک تغییر نمی‌کند. برای محصول ثبت‌شده نوع صنف برای محافظت از سابقه قفل است.
- فیلد native `sku` با حالت خودکار/دستی؛ بارکد اصلی با حالت خودکار/دستی در آرایه native `barcodes` با بارکدهای اضافی و رنگ‌ها نگهداری می‌شود. تشخیص کُد تکراری و مالکیت بارکد از `ZaviBarcodeV641.inspect` و ثبت اصلی می‌آید. دوربین آفلاین اصلی با هدف `z66ProductPrimaryBarcode` متصل شده؛ برای barcode محصول نباید Enter مصنوعی فرم را submit کند. USB/OTG و Bluetooth HID از دستگاه‌های سازگار *keyboard wedge* استفاده می‌کنند؛ ورود کُد تایپی و ختم Enter/Tab در فیلد مجاز است. جفت‌شدن یا اتصال واقعی Bluetooth سخت‌افزار هنوز اثبات نشده.
- واحد قیمت `USD` نرخ دستی `productManualUsdRate` دارد؛ `productPriceMeta` ارز، قیمت‌های اصلی و نرخ را حفظ می‌کند؛ در دفتر مالی `salePrice` و `purchasePrice` به پول اصلی ثبت می‌شوند. ارقام قبلی فاکتور تغییر نمی‌کنند. `defaultWarehouseId` برای انتخاب گدام پیش‌فرض نگهداری شده؛ **این به‌تنهایی اثبات موجودی کاملاً مستقل برای کالای غیررنگی در تمام گدام‌ها نیست**. دفتر موجودی رنگ/گدام و سیستم سروری گدام نیازمند تست واقعی جداگانه‌اند.
- **شواهد تأییدشدهٔ GitHub:**
  - [Adaptive product focus QA / 43211284288](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43211284288): **SUCCESS** برای آخرین SHA کد `4e77be92`؛ تمام ۲۱ فرم native، نام واقعی لوازم موبایل، حالت‌های اسکن، حفاظت رنگ‌ها و USD نرخ دستی مرورگری چک شدند.
  - [Original owner APK visual QA / 43211284036](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43211284036): **SUCCESS** برای `4e77be92`، شامل فرم محصولات، فروش و طرح اصلی.
  - [Migration integrity / 43211284159](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43211284159): **SUCCESS** برای `4e77be92`.
  - [Stage6 accounting/unsigned compile / 43211022656](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43211022656): **SUCCESS** در کد `9b89a4eb` (همان قابلیت‌های اجرایی؛ بعد از آن فقط تست انتظار DOM اصلاح شد)، شامل Android R8 بدون امضا و Windows.
- **مرزبندی اجباری:** آزمون واقعی روی گوشی کاربر، اسکنر Bluetooth/USB فیزیکی، دوربین گوشی و ارتقای APK امضاشده **ثبت نشده‌اند**. [REBORN clean Android QA / 43211022839](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43211022839) همچنان در مرحلهٔ امضای ثابت ONE و ADMIN **FAIL** است (محدودیت Secrets قبلی، Issue #3). APK جدید/نهایی تحویل داده نشود تا برطرف و تأیید شود. دادهٔ واقعی Supabase تغییر نکرده است.
- درخواست بعدی باید نخست همان **یک مشکل تازه** را از عکس کاربر مشخص و دیمو را برای تأیید ارائه کند؛ از دستکاری طرح‌های تأییدشده خودداری شود.

## 6C. افزودن گدام از فرم اصلی محصول و ممیزی تکمیلی — 2026-11-12
- پس از تأیید دیموی کاربر، فرم اصلی ثبت محصول به «افزودن گدام» مجهز شد: [df47e422](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/commit/df47e422903131f71c72b3bc98ca2b77d741ee0e). دکمه در فرم native باز می‌شود، نام و کُد اختیاری دریافت می‌کند، و **فقط با حساب ابری مالک** از سرویس موجود `ZaviWarehouseV1.create` گدام را به `/rest/v1/zavi_warehouses` POST می‌کند. اگر سرور یک ردیف معتبر همان workspace را تأیید کند، ID در select گدام محصول درج می‌شود. کُد خالی با `crypto.getRandomValues` ساخته می‌شود؛ هیچ موجودی مصنوعی یا تراکنش حسابداری ساخته نمی‌شود.
- مشکل اعتبارسنجی stale select بعد از افزودن گدام در همان modal نیز در [be0ab70b](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/commit/be0ab70be7bc6eccdf3cb86e34fe6849ffb7364a) اصلاح شد. انتخاب ثبت‌شده مقابل catalog معتبر owner-scoped دوباره بررسی می‌شود. محافظ server/RLS و ledger موجود حفظ شده‌اند. این اصلاح هنوز جای تست واقعی RLS و end-to-end با حساب‌های متعدد را نمی‌گیرد.
- آزمون مرورگر فقط **پاسخ مصنوعیِ تأیید گدام** را تزریق کرده و اثبات می‌کند که native select تازه می‌شود و هیچ محصول، فاکتور یا تراکنشِ آزمایشی در مرورگر نوشته نمی‌شود. تست واقعی با write در Supabase مشتری اجرا **نشده**؛ نباید ادعای تأیید صددرصد دیتابیس شود.
- نتایج واقعی CI برای SHA `be0ab70b`: [Adaptive product focus / 43212843092](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43212843092) **SUCCESS**، [Original APK visual QA / 43212843121](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43212843121) **SUCCESS**، [Migration integrity / 43212843113](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43212843113) **SUCCESS**، [Stage6 accounting, Android R8 unsigned, Windows / 43212843096](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43212843096) **SUCCESS**.
- امضای پایدار QA همچنان به‌دلیل Secrets ناقص در runner **FAIL** است و Issue #3 باز است؛ هیچ APK نهایی تحویل نشده. اسکن فیزیکی دوربین/USB/Bluetooth نیز تأیید نشده.
- **تکمیل‌شده پس از گزارش بالا:** اختلاف دیموی ۲۱ صنف با schema قدیمی بدون حذف یا بازنام‌گذاری دادهٔ قبلی برطرف شد. توضیحات مستند «6D» پایین را بخوانید.

## 6D. تطبیق دقیق فهرست ۲۱ صنف تأییدشده و حفظ داده‌های قدیمی — 2026-11-12
- کامیت واقعی [73d59062](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/commit/73d590622408088162be9c12f173c538e72680f4) در `dev`: فهرست **۲۱ صنف انتخاب‌پذیرِ ثبت محصول** دقیقاً مطابق دیموی تأییدشده است: تجارت عمومی، سوپرمارکیت، زرگری، دواخانه، عمده‌فروشی، پوشاک، کتاب‌فروشی، کفش، آرایشی، الکترونیک، مبلمان، ابزار، صرافی، مصالح ساختمانی، موبایل، لوازم موبایل، مواد غذایی، رستورانت، لوازم موتر، خدمات، زراعت و مالداری.
- برای جلوگیری از آسیب به محصولات قدیمی، **۲۱ نوع تاریخیِ `ZaviIndustryForms6529.types` بدون حذف یا تغییر ID محفوظ** هستند. چهار schema تازهٔ `food`، `restaurant`، `automotive` و `agriculture` افزوده شده‌اند. `approvedTypes` دقیقاً ۲۱ نوع تازه/موجود در دیمو را برمی‌گرداند؛ جمعاً ۲۵ schema برای خواندن سابقهٔ قدیمی و جدید موجود است. در ویرایش محصول قدیمی، نوع اصلی برای حفظ سابقه نمایش داده و قفل می‌شود.
- دسته‌بندی‌های اختصاصی هر چهار صنف و کنترل‌های `expiry`، وزن/حجم، کشور تولید، مواد تشکیل‌دهنده، اندازه پرس، مدت آماده‌سازی، شماره پرزه، مدل موتر، فصل/تاریخ کشت و نوع محصول اضافه شدند. `normalize/collect/render` همان API قدیمی است؛ برای ردیف مالی/موجودی تابع جدیدِ موازی ایجاد نشده است.
- [آزمون مرورگریِ ثبت محصول / 43213507259](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43213507259) برای SHA `73d59062` **SUCCESS**: تمام ۲۱ نوع تأییدشده روی فرم واقعی باز می‌شوند؛ مجموعهٔ قدیمی نیز intact است؛ تغییر صنف فقط روی draft همین محصول اثر دارد؛ تست گدام server-mock و نرخ USD و اسکن HID موفق هستند. [Migration / 43213507243](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43213507243) **SUCCESS**؛ [Stage6 / 43213507482](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/43213507482) **SUCCESS** با شش Job حسابداری، تم‌ها، R8 اندروید بدون امضا، و کامپایل ویندوز.
- محدودیت واقعی: **هیچ آزمون افزودن گدام با write روی Supabase مشتری، اسکن بارکد فیزیکی USB/Bluetooth یا گوشی واقعی، یا امضای APK انجام نشده است**. `ZaviWarehouseV1.create` از REST احراز هویت‌شدهٔ مالک استفاده می‌کند؛ تست مرورگری پاسخ سرور را mock می‌کند. همچنان Issue #3 Signing باز است؛ APK نهایی تحویل ندهید.
- طراحی فروش و داشبوردهای قبلاً تأییدشده حفظ شدند؛ UI جدید برای محصولات تا تست روی دستگاه حقیقی باید با احتیاط گزارش شود. برای گدام‌های محصول غیررنگی، تطبیق جداگانهٔ دفتر موجودی تمامی مسیرها هنوز نیازمند بررسی واقعی است.

## 7. دستور ادامه در چت جدید
«فایل `docs/CURRENT_HANDOFF_2026-11-12.md` و Issue #3 مخزن `zavyanmasoom3-source/ZAVI-ONE-REBORN` شاخه `dev` را بخوان. ابتدا head جدید و وضعیت Actions را با این گزارش مقایسه کن. فقط مانع ثبت‌شدهٔ امضای QA را بدون دورزدن امنیت بررسی کن. هر تغییر واقعی را با SHA کامیت و نتیجهٔ CI گزارش کن. تا زمان برطرف‌شدن مانع، هیچ APKی را تحویل/نهایی اعلام نکن. تصمیم‌های UI، حسابداری، آفلاین و Supabase را حفظ کن.»
