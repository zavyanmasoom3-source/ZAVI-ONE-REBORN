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
- **وضعیت:** تغییرات در سورس وجود دارند، اما آزمون روی گوشی واقعی و پذیرش نهایی مالک **ثبت/اثبات نشده**؛ هرگز 100% حل‌شده اعلام نشود.

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

## 7. دستور ادامه در چت جدید
«فایل `docs/CURRENT_HANDOFF_2026-11-12.md` و Issue #3 مخزن `zavyanmasoom3-source/ZAVI-ONE-REBORN` شاخه `dev` را بخوان. ابتدا head جدید و وضعیت Actions را با این گزارش مقایسه کن. فقط مانع ثبت‌شدهٔ امضای QA را بدون دورزدن امنیت بررسی کن. هر تغییر واقعی را با SHA کامیت و نتیجهٔ CI گزارش کن. تا زمان برطرف‌شدن مانع، هیچ APKی را تحویل/نهایی اعلام نکن. تصمیم‌های UI، حسابداری، آفلاین و Supabase را حفظ کن.»
