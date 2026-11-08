# ZAVI ONE — راهنمای امضای امن و Secrets در GitHub

**وضعیت:** کد امضای ثابت QA آماده است؛ تا پیش از ثبت Secrets، دو بیلد موفق و آزمون دستگاه، APK قابل‌انتشار تأیید نشده است.

## قانون اصلی آپدیت Android

برای آپدیت مستقیم باید applicationId، هویت گواهی امضا و نسخه افزایشی باشند. کلید تازه به تنهایی نمی‌تواند APK قبلاً نصب‌شده را آپدیت کند.

| نسخه | applicationId | گواهی SHA-256 |
|---|---|---|
| ONE اصلی 66.75 | com.zavione.one | f88cfa395f1f256198e81a82ae002de591d772745ae19c70a495b23619c25f25 |
| ONE QA | com.zavione.one.rebornqa | 7e68bc0c0525785de756acc56a72c25fc171f1b01dd579e7a9b343133b29757c |
| ADMIN QA | com.zavione.one.admin.rebornqa | 78395f24d3543bc5ac91ac268142ea849d79ef8efc0518ffeb878ac6980613de |
| ADMIN اصلی | com.zavione.one.admin | باید از APK اصلی اندازه‌گیری شود |

## ۱. اول کلید اصلی را بررسی کنید

۱. APK اصلی و برنامه نصب‌شده را پاک نکنید.
۲. با Android SDK، اثرانگشت APK قبلی را بخوانید:

~~~bash
apksigner verify --verbose --print-certs /path/to/OLD.apk
~~~

۳. Keystore قدیمی را در کامپیوتر امن باز کنید. ابزار keytool رمز را تعاملی می‌پرسد:

~~~bash
keytool -list -v -keystore /path/to/ORIGINAL_KEYSTORE -alias ORIGINAL_ALIAS
~~~

۴. گواهی SHA-256 هر دو باید برابر باشد. برای ONE اصلی، مرجع نمونه 66.75 در جدول فوق آمده است. اثرانگشت ADMIN باید جداگانه از APK قبلی تأیید شود.

۵. اگر کلید اصلی موجود است، چهار Secret برای ساخت Release ONE با پیشوند ZAVI_RELEASE_ONE_ و چهار Secret برای ADMIN با پیشوند ZAVI_RELEASE_ADMIN_ مطابق فایل workflow به نام release-signing-preflight.yml ثبت کنید؛ برای ADMIN همچنین ZAVI_RELEASE_ADMIN_EXPECTED_CERT_SHA256 را از APK اصلی بگیرید. متغیر عمومی repository با نام ZAVI_RELEASE_PREFLIGHT باید enabled باشد. این preflight فقط نسخهٔ بررسی امضا می‌سازد و APK را منتشر نمی‌کند.

## ۲. اگر کلید اصلی گم شده است

راه امن اول: از برنامهٔ قدیمی با خود برنامه بکاپ معتبر و مستقل بگیرید؛ تعداد فاکتور، مشتری، چک، موجودی گدام، صندوق و عملیات ارسال‌نشده را ثبت کنید. نسخهٔ تازه را با applicationId متفاوت کنار نسخهٔ قبلی نصب کنید، به حساب آزمایشی بازیابی کنید و مانده‌ها را تطبیق دهید. تا تأیید کامل، نسخهٔ قدیمی را حذف نکنید.

راه دوم، فقط اگر از اول برنامه با Google Play App Signing توزیع شده است: بررسی امضای توزیعی و قابلیت‌های رسمی Play. تعویض upload key لزوماً به معنای امکان امضای فایل APK سایدلود با گواهی متفاوت نیست.

## ۳. ساخت Keystore جدید فقط برای هویت تازه

اگر Keystoreهای QA از پیش موجود و متناظر با اثرانگشت‌های پین‌شده را دارید، دوباره نسازید. وگرنه پس از تصمیم مالک دربارهٔ مهاجرت، در Windows PowerShell یا Terminal مک/لینوکس با JDK 17+ اجرا کنید. رمزها به صورت تعاملی خواسته می‌شوند.

~~~bash
keytool -genkeypair -storetype PKCS12 -keystore ZAVI_ONE_RELEASE.p12 -alias zavi-one-release -keyalg RSA -keysize 3072 -sigalg SHA256withRSA -validity 36500 -dname "CN=ZAVI ONE Signing, O=ZAVI ONE, C=GB"
keytool -genkeypair -storetype PKCS12 -keystore ZAVI_ADMIN_RELEASE.p12 -alias zavi-admin-release -keyalg RSA -keysize 3072 -sigalg SHA256withRSA -validity 36500 -dname "CN=ZAVI ONE ADMIN Signing, O=ZAVI ONE, C=GB"
~~~

برای هر برنامه رمز قوی و جداگانه بگذارید. گواهی تازه با signing/certificates.json متفاوت خواهد بود و **هویت تازه** ایجاد می‌کند. قبل از نخستین انتشار، fingerprint عمومی جدید باید با بررسی مالک، ثبت تغییرات و برنامهٔ مهاجرت به صورت رسمی پین شود؛ صرفاً برای سبزکردن آزمون مقدار pin را عوض نکنید.

## ۴. Base64 گرفتن از فایل

در Linux/macOS:
~~~bash
base64 < ZAVI_ONE_RELEASE.p12 | tr -d '\r\n'
base64 < ZAVI_ADMIN_RELEASE.p12 | tr -d '\r\n'
~~~

در PowerShell ویندوز:
~~~powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path '.\ZAVI_ONE_RELEASE.p12').Path)) | Set-Clipboard
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path '.\ZAVI_ADMIN_RELEASE.p12').Path)) | Set-Clipboard
~~~

Base64 کلید خصوصی رمزگذاری‌شده است، نه یک دادهٔ عمومی! فقط در GitHub Secret وارد کنید؛ آن را در گفتگو، Issue، لاگ، عکس یا مخزن منتشر نکنید. حافظهٔ Clipboard را پاک کنید.

## ۵. ثبت ۸ Secret در GitHub

لینک: https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/settings/secrets/actions

مسیر: Settings → Secrets and variables → Actions → Secrets → New repository secret.

| نام دقیق | مقدار |
|---|---|
| ZAVI_KEYSTORE_BASE64 | Base64 یک‌خطی Keystore ثابت QA برنامه ONE |
| ZAVI_KEYSTORE_PASSWORD | رمز فایل Keystore برنامه ONE |
| ZAVI_KEY_ALIAS | zavi-one-release یا alias واقعی |
| ZAVI_KEY_PASSWORD | رمز کلید خصوصی ONE |
| ADMIN_KEYSTORE_BASE64 | Base64 یک‌خطی Keystore ثابت QA برنامه ADMIN |
| ADMIN_KEYSTORE_PASSWORD | رمز فایل Keystore برنامه ADMIN |
| ADMIN_KEY_ALIAS | zavi-admin-release یا alias واقعی |
| ADMIN_KEY_PASSWORD | رمز کلید خصوصی ADMIN |

نام‌های قدیمی ZAVI_ONE_KEYSTORE_BASE64، ZAVI_ONE_STORE_PASSWORD، ZAVI_ONE_KEY_ALIAS، ZAVI_ONE_KEY_PASSWORD و معادل ZAVI_ADMIN_* نیز پشتیبانی می‌شوند. اگر هر دو نام قدیم و جدید وجود داشته باشند، نام جدید اولویت دارد. رمز یا fingerprint نادرست خطای فارسی می‌دهد و بیلد را بدون تولید APK متوقف می‌کند.

## ۶. دو بیلد متوالی و آزمایش آپدیت

۱. workflow «REBORN clean Android QA builds» را از Actions روی شاخه dev اجرا کنید. هر دو Artifact مستقل باید ساخته شوند و لاگ apksigner verify --verbose --print-certs موفق باشد.
۲. workflow را بار دوم اجرا کنید. versionCode اجرای جدید باید بالاتر باشد.
۳. هر دو APK همان برنامه را روی کامپیوتر با Android SDK مقایسه کنید:

~~~bash
python3 scripts/verify-apk-pair.py --app one --mode qa --previous-apk /path/ONE-old.apk --current-apk /path/ONE-new.apk --expected-sha256 7e68bc0c0525785de756acc56a72c25fc171f1b01dd579e7a9b343133b29757c
~~~

برای ADMIN، app=admin و گواهی ADMIN جدول اول را قرار دهید.

۴. در دستگاه *کاملاً آزمایشی بدون اطلاعات مشتری* USB debugging را فعال کنید و برای آزمون حفظ دادهٔ خصوصی اجرا کنید:

~~~bash
python3 scripts/test-android-upgrade-on-device.py --app one --previous-apk /path/ONE-old.apk --next-apk /path/ONE-new.apk --dedicated-qa-device
~~~

تست فوق فقط فایل آزمون در دایرکتوری خصوصی را چک می‌کند. حفظ فاکتور، مانده و Sync واقعی باید جداگانه با داده آزمایشی ثابت شود. این ابزار QA مخصوص APK debuggable امضاشده با کلید ثابت است؛ برای Release اصلی به تست نصب غیرمخرب جداگانه نیاز است.

## ۷. نگهداری امن کلید

از هر Keystore و رمز آن دو بکاپ رمزگذاری‌شده در دو مکان مستقل بگیرید، بازیابی آزمایشی و SHA-256 فایل بازیابی‌شده را تأیید کنید. دسترسی را به مالک انتشار محدود و MFA فعال کنید. کلید یا رمز را در مخزن یا داخل APK قرار ندهید. از دست‌رفتن کلید خصوصی اصلی به معنی نبود امکان آپدیت مستقیم با همان گواهی است.

**وضعیت فعلی:** Secrets هنوز در اجرای GitHub Actions در دسترس نیستند. QA source checks موفق‌اند، اما build Android و آپدیت روی دستگاه هنوز تأیید نشده است. هیچ APK جدیدی نباید «نهایی» نامیده شود.
