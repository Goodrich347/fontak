# راهنمای انتشار فونتک در GitHub و Chrome Web Store

این راهنما برای نسخه `2.4.0` نوشته شده است. رمز عبور، کد ورود دومرحله‌ای یا اطلاعات کارت بانکی را برای هیچ‌کس ارسال نکنید.

## ۰. اطلاعاتی که قبل از شروع باید تعیین شوند

- نام کاربری GitHub: `YOUR_GITHUB_USERNAME`
- نام ناشر در Chrome Web Store: `YOUR_PUBLISHER_NAME`
- ایمیل عمومی پشتیبانی و حریم خصوصی: `YOUR_EMAIL@example.com`
- مجوز کد: پیشنهاد برای متن‌باز واقعی **MIT**؛ اگر نمی‌خواهید دیگران حق کپی و تغییر کد داشته باشند، فعلاً فایل LICENSE اضافه نکنید.

پیش از انتشار، این سه placeholder را در `PRIVACY.md`، `PRIVACY.html`، `SUPPORT.md` و `STORE_LISTING.md` جایگزین کنید.

## ۱. آزمایش بسته نهایی روی Chrome

1. فایل `fontak.zip` را Extract کنید.
2. در Chrome آدرس `chrome://extensions` را باز کنید.
3. **Developer mode** را روشن کنید.
4. روی **Load unpacked** بزنید و پوشه `fontak` را انتخاب کنید.
5. یک فایل فونت آزمایشی اضافه کنید.
6. یک سایت عادی `https://` را باز کنید؛ فونتک را باز کنید و «فعال‌کردن برای این سایت» را بزنید.
7. در پنجره Chrome فقط اجازه همان سایت را تأیید کنید.
8. حالت «فقط خط فارسی، عربی و اردو»، RTL، قانون کل سایت، قانون فقط همین صفحه و حذف قانون را جداگانه بررسی کنید.
9. صفحه را Reload و Chrome را یک‌بار بسته و باز کنید تا ماندگاری قانون بررسی شود.

## ۲. ساخت مخزن عمومی GitHub

1. در `https://github.com/signup` حساب بسازید یا وارد شوید؛ ورود دومرحله‌ای را فعال کنید.
2. به `https://github.com/new` بروید.
3. در **Repository name** بنویسید: `fontak`
4. در **Description** این متن را بگذارید:

   `A local-first Chrome extension for assigning custom Persian, Arabic and Urdu fonts to selected websites.`

5. **Public** را انتخاب کنید.
6. گزینه‌های README، `.gitignore` و License را در این صفحه فعال نکنید؛ فایل‌های پروژه از قبل آماده‌اند.
7. روی **Create repository** بزنید.
8. در صفحه مخزن، **uploading an existing file** را انتخاب کنید.
9. تمام محتویات داخل پوشه `fontak` را Upload کنید؛ خود پوشه مادر را به‌صورت یک لایه اضافه داخل مخزن نگذارید. `manifest.json` باید در ریشه مخزن دیده شود.
10. پیام Commit را `Release Fontak 2.4.0` بنویسید و Commit کنید.
11. در بخش **About** این Topicها را اضافه کنید: `chrome-extension`, `persian-font`, `arabic-font`, `urdu-font`, `rtl`, `manifest-v3`, `accessibility`.
12. اگر MIT را انتخاب کردید، از **Add file > Create new file** یک فایل به نام `LICENSE` با متن استاندارد MIT و نام/سال درست اضافه کنید.

## ۳. فعال‌کردن صفحه حریم خصوصی

1. در مخزن GitHub به **Settings > Pages** بروید.
2. در **Build and deployment**، گزینه **Deploy from a branch** را انتخاب کنید.
3. Branch را `main` و Folder را `/ (root)` بگذارید و **Save** کنید.
4. چند دقیقه صبر کنید و این URL را باز کنید:

   `https://YOUR_GITHUB_USERNAME.github.io/fontak/PRIVACY.html`

5. صفحه باید بدون خطای 404 باز شود. همین URL را بعداً در Chrome Web Store وارد کنید.

## ۴. ساخت Release در GitHub

1. در مخزن به **Releases > Draft a new release** بروید.
2. Tag را `v2.4.0` و Title را `Fontak v2.4.0 — Vazirmatn by default and security hardening` بگذارید.
3. متن Release Notes آماده در `STORE_LISTING.md` را کپی کنید.
4. فایل `fontak.zip` را ضمیمه کنید.
5. روی **Publish release** بزنید.

## ۵. ثبت حساب ناشر Chrome Web Store

1. ترجیحاً یک Google Account اختصاصی برای انتشار افزونه بسازید؛ ایمیل حساب ناشر بعداً به‌سادگی قابل تغییر نیست.
2. وارد `https://chrome.google.com/webstore/devconsole/` شوید.
3. قرارداد توسعه‌دهنده را بخوانید و بپذیرید.
4. هزینه ثبت یک‌باره‌ای را که خود Dashboard نشان می‌دهد پرداخت کنید.
5. در تنظیمات حساب، **Publisher name** را وارد و ایمیل را Verify کنید.
6. رمز، کد دومرحله‌ای، پرداخت و پذیرش قرارداد باید توسط خود مالک حساب انجام شود.

## ۶. آماده‌کردن تصاویر Store

قبل از Submit باید این موارد آماده باشند:

- آیکن `128×128` داخل بسته؛ آماده است: `icons/icon-128.png`
- حداقل یک Screenshot واقعی با ابعاد `1280×800` یا `640×400`
- Small promo tile با ابعاد `440×280`
- Marquee با ابعاد `1400×560` اختیاری است.

در Screenshot اطلاعات شخصی، تب‌های خصوصی، ایمیل یا سایت بانکی نشان ندهید. تصویر باید عملکرد واقعی فونتک را نمایش دهد، نه قابلیت ساختگی.

## ۷. بارگذاری در Chrome Web Store

1. در Developer Dashboard روی **New item** یا **Add new item** بزنید.
2. فقط فایل `fontak-chrome-store-v2.4.0.zip` را Upload کنید.
3. اگر خطای `manifest.json missing` دیدید، ZIP اشتباه است؛ `manifest.json` باید دقیقاً در ریشه ZIP باشد، نه داخل پوشه `fontak/`.
4. در تب **Store listing** عنوان، Summary، توضیحات فارسی/انگلیسی و URLهای آماده در `STORE_LISTING.md` را وارد کنید.
5. Category را **Accessibility**، زبان اصلی را **Persian** و قیمت را **Free** بگذارید.
6. Screenshot و Small promo tile را Upload کنید.

## ۸. تکمیل Privacy

1. **Single purpose** و justificationهای `storage`، `unlimitedStorage`، `activeTab`، `scripting` و optional host access را عیناً از `STORE_LISTING.md` کپی کنید.
2. در Data usage، **Web browsing activity** را اعلام کنید چون URL فعلی برای تطبیق قانون محلی خوانده می‌شود.
3. اعلام کنید URLها، فونت‌ها و تنظیمات فقط محلی‌اند و ارسال، فروش، اشتراک، تبلیغات یا Analytics وجود ندارد.
4. Privacy Policy URL را آدرس GitHub Pages مرحله ۳ قرار دهید.
5. گواهی‌های Limited Use را فقط اگر متنشان با رفتار واقعی افزونه تطابق دارد تأیید کنید.

## ۹. Distribution، دستور تست و ارسال برای Review

1. Distribution را **Public**، همه مناطق، **Free** و Mature content را **No** بگذارید.
2. Test instructions آماده `STORE_LISTING.md` را وارد کنید؛ حساب یا credential آزمایشی لازم نیست.
3. تمام خطاهای قرمز Dashboard را رفع کنید.
4. برای انتشار اول، انتشار خودکار بعد از تأیید را خاموش کنید تا کنترل زمان انتشار دست خودتان باشد.
5. روی **Submit for review** بزنید.
6. بررسی معمولاً چند روز طول می‌کشد، اما ممکن است چند هفته شود. اگر بیشتر از سه هفته بدون نتیجه ماند، از پشتیبانی Web Store پیگیری کنید.
7. بعد از Approval، روی **Publish** بزنید و صفحه عمومی افزونه را آزمایش کنید.

## ۱۰. انتشار نسخه‌های بعدی

1. عدد `version` در `manifest.json` را افزایش دهید؛ مثلاً `2.4.1`.
2. تست‌ها را دوباره اجرا و ZIP Store جدید با `manifest.json` در ریشه بسازید.
3. در Chrome Developer Dashboard بسته جدید را Upload و دوباره Submit کنید.
4. همان نسخه را در GitHub Commit و Release کنید.

## متن کوتاه معرفی فارسی

فونتک به شما اجازه می‌دهد فونت‌های فارسی، عربی و اردو را روی دستگاه خود نگه دارید و برای هر سایت یا صفحه، فونت و حالت RTL جداگانه انتخاب کنید. هیچ سایتی به‌صورت پیش‌فرض تغییر نمی‌کند و دسترسی هر دامنه فقط با انتخاب صریح کاربر فعال می‌شود.

## خطاهای رایج

- ZIP پوشه‌دار: Store نمی‌تواند `manifest.json` را پیدا کند.
- Privacy URL با 404: GitHub Pages هنوز Deploy نشده یا placeholder نام کاربری جایگزین نشده است.
- Screenshot با اندازه غلط: Store آن را رد می‌کند.
- نسخه تکراری: عدد `version` باید از نسخه آپلودشده قبلی بزرگ‌تر باشد.
- مجوز اضافه: هر permission غیرضروری احتمال رد یا طولانی‌شدن Review را بالا می‌برد.
- انتشار بدون LICENSE در GitHub: دیگران کد را می‌بینند، اما مجوز روشن برای استفاده/تغییر آن ندارند.
