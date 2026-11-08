# راهنمای کوتاه مالک — امضای دائمی و حفاظت انتشار (2026-11-09)

**هشدار:** هیچ رمز، فایل Keystore یا Base64 را در ChatGPT، Issue، کد یا لاگ منتشر نکنید. بدون fingerprint یکسان با APK نصب‌شده، آپدیت مستقیم برنامهٔ قدیمی ممکن نیست. کلیدهای QA پین‌شده را بی‌دلیل دوباره نسازید. نسخهٔ QA با applicationId مستقل از نسخهٔ اصلی نصب می‌شود.

## مرحلهٔ ۱: Keystore اصلی را پیدا کنید

اگر Keystore نسخهٔ نصب‌شده را دارید، به جای ساخت جدید آن را با این دستور روی کامپیوتر بررسی کنید (رمز تعاملی است):

~~~bash
keytool -list -v -keystore ORIGINAL_KEYSTORE -alias ORIGINAL_ALIAS
apksigner verify --verbose --print-certs OLD_INSTALLED_APK.apk
~~~

گواهی SHA-256 باید **دقیقاً** برابر باشد؛ نام فایل یا تاریخ اعتبار کافی نیست. بررسی نسخهٔ واقعاً نصب‌شده ضروری است. نمونهٔ ONE اصلی 66.75 در مستندات، گواهی f88cfa395f1f256198e81a82ae002de591d772745ae19c70a495b23619c25f25 داشت؛ QAهای قدیمی با گواهی‌های Android Debug متفاوت ساخته شده‌اند.

اگر ندارید، استفاده از کلید جدید فقط برای **هویت جدید** و مهاجرت با Export/Import مجاز است. تا وقتی بکاپ کامل و بازگرداندن فاکتور، موجودی، مشتری، چک و صندوق در محیط جدا آزمایش نشده، نسخهٔ قدیمی را پاک نکنید.

## مرحلهٔ ۲: ساخت دو Keystore جدید، فقط برای نصب تازه

JDK 17 یا بالاتر را روی Windows/macOS/Linux نصب کنید. این دستورها با رمز تعاملی فایل‌های PKCS12 با اعتبار حدود ۱۰۰ سال می‌سازند:

~~~bash
keytool -genkeypair -storetype PKCS12 -keystore ZAVI_ONE_NEW.p12 -alias zavi-one-release -keyalg RSA -keysize 3072 -sigalg SHA256withRSA -validity 36500 -dname "CN=ZAVI ONE,O=ZAVI ONE"
keytool -genkeypair -storetype PKCS12 -keystore ZAVI_ADMIN_NEW.p12 -alias zavi-admin-release -keyalg RSA -keysize 3072 -sigalg SHA256withRSA -validity 36500 -dname "CN=ZAVI ONE ADMIN,O=ZAVI ONE"
~~~

اثر انگشت عمومی را از هر فایل با keytool -list -v بخوانید. **اگر با signing/certificates.json متفاوت بود، CI باید متوقف بماند.** تغییر pin فقط با تصمیم رسمی هویت جدید، بررسی مالک و طرح انتقال داده مجاز است. اگر دو Keystore QA موجود با fingerprint پین‌شده دارید، همین‌ها را نگه دارید و کلید تازه نسازید.

## مرحلهٔ ۳: Base64

Windows PowerShell (هر فایل جداگانه):

~~~powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path '.\ZAVI_ONE_NEW.p12').Path)) | Set-Clipboard
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path '.\ZAVI_ADMIN_NEW.p12').Path)) | Set-Clipboard
~~~

macOS / Linux:

~~~bash
base64 < ZAVI_ONE_NEW.p12 | tr -d '\r\n'
base64 < ZAVI_ADMIN_NEW.p12 | tr -d '\r\n'
~~~

رشتهٔ Base64 را فقط در GitHub Secret مربوط قرار دهید، سپس Clipboard را پاک کنید. آن را در فایل متن، لاگ یا گفتگو ذخیره نکنید.

## مرحلهٔ ۴: هشت Secret برای QA ایمن

Repository → Settings → Secrets and variables → Actions → New repository secret:

| ONE | ADMIN |
|---|---|
| ZAVI_KEYSTORE_BASE64 | ADMIN_KEYSTORE_BASE64 |
| ZAVI_KEYSTORE_PASSWORD | ADMIN_KEYSTORE_PASSWORD |
| ZAVI_KEY_ALIAS | ADMIN_KEY_ALIAS |
| ZAVI_KEY_PASSWORD | ADMIN_KEY_PASSWORD |

رمز و alias هر برنامه مستقل است. Workflow QA بدون همه چهار مقدار هر برنامه یا با fingerprint ناسازگار، با پیام فارسی متوقف می‌شود و debug/ephemeral را جایگزین نمی‌کند.

## مرحلهٔ ۵: حفاظت از Production

۱. در GitHub مخزن → Settings → Environments → New environment نام production را وارد کنید.
۲. محیط production را باز کنید، بخش Environment protection rules → Required reviewers را فعال کنید، حساب مالک/منتشرکننده را انتخاب و Save protection rules بزنید. اگر Prevent self-reviews در دسترس است، از حساب انتشار جدا برای تأیید استفاده کنید.
۳. در همان صفحه، Deployment branches and tags را به Selected branches and tags محدود کنید و تنها شاخهٔ dev یا شاخهٔ Release مورد توافق را مجاز کنید. توجه: اجازهٔ اجرای dev به تنهایی به معنای آمادگی انتشار نیست.
۴. در Environment secrets → Add secret، کلیدهای تولید (اصل) را با نام‌های دقیق زیر قرار دهید:
   - ONE: ZAVI_RELEASE_ONE_KEYSTORE_BASE64، ZAVI_RELEASE_ONE_STORE_PASSWORD، ZAVI_RELEASE_ONE_KEY_ALIAS، ZAVI_RELEASE_ONE_KEY_PASSWORD
   - ADMIN: ZAVI_RELEASE_ADMIN_KEYSTORE_BASE64، ZAVI_RELEASE_ADMIN_STORE_PASSWORD، ZAVI_RELEASE_ADMIN_KEY_ALIAS، ZAVI_RELEASE_ADMIN_KEY_PASSWORD
   - برای ADMIN اصل، فقط fingerprint عمومی تأییدشده: ZAVI_RELEASE_ADMIN_EXPECTED_CERT_SHA256.
۵. Secretهای Production را از **Repository secrets** حذف کنید یا در آنجا نگهداری نکنید؛ در غیر این صورت هر Workflow دارای دسترسی به Repository Secrets ممکن است به آن‌ها برسد. Workflow release-signing-preflight اکنون به environment: production متصل شده و بدون Required Reviewer دستی **حفاظت واقعی ندارد**.
۶. Settings → Secrets and variables → Actions → Variables → New repository variable: نام ZAVI_RELEASE_PREFLIGHT با مقدار enabled. سپس Actions → Original-key update compatibility preflight → Run workflow روی dev. این مرحله فقط امضای کاندیدا را بررسی و فایل را حذف می‌کند؛ منتشر نمی‌کند.

## مرحلهٔ ۶: Branch protection

در Repository → Settings → Branches → Add branch protection rule، Branch name pattern را dev قرار دهید. Require a pull request before merging، Require status checks to pass before merging، Do not allow bypassing the above settings و Block force pushes را مطابق سیاست تیم فعال کنید. وضعیت الزامی را از اجرای واقعی Migration integrity gate انتخاب کنید. Save changes را بزنید.

اگر جایگزین Rulesets در حساب موجود است: Settings → Rules → Rulesets → New branch ruleset، Target branches = dev و Required checks/PR reviews را تنظیم و Active کنید. تغییرات بعدی باید از Pull Request عبور کنند.

GitHub Free/plan/organization ممکن است بعضی کنترل‌های Environment و Branch Protection را محدود کند؛ در صفحهٔ واقعی بررسی کنید. تا فعال‌شدن حفاظت، **هیچ Secret تولید** را وارد نکنید.

## مرحلهٔ ۷: بعد از ورود Secrets

۱. ابتدا QA Android workflow را **دو بار** روی dev اجرا و موفقیت مستقل هر دو برنامه را تأیید کنید.
۲. در خروجی APK با apksigner verify --verbose --print-certs امضاهای v1/v2/v3 و SHA-256 گواهی را بررسی کنید. هش فایل APK را با sha256sum ثبت کنید.
۳. از APK قدیمی و جدیدِ **همان package و گواهی** روی دستگاه آزمایشی، adb install -r و حفظ فایل محلی/ماندهٔ آزمایشی را بررسی کنید.
۴. تا تأیید Sync، چک، مجوزها، PDF و تست دستگاه، Release عمومی انجام نشود.
۵. از هر دو Keystore دو بکاپ رمزگذاری‌شده و جداگانه بگیرید؛ بازیابی را آزمایش کنید. گم‌شدن کلید خصوصی را نمی‌توان با fingerprint جبران کرد.

**وضعیت امروز:** کد و راهنما موجود است ولی Secrets، حفاظت واقعی Environment، امضای Release و تست دستگاه هنوز توسط لاگ موفق ثابت نشده‌اند.
