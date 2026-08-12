# Fontak — Chrome Web Store Listing

قبل از انتشار، تمام عبارت‌های `YOUR_GITHUB_USERNAME`، `YOUR_PUBLISHER_NAME` و `YOUR_EMAIL@example.com` را جایگزین کنید.

## Product details — فارسی

### Title

فونتک — فونت دلخواه برای هر سایت

### Summary

چند فونت فارسی اضافه کنید و برای هر سایت یا صفحه، فونت و جهت RTL دلخواه خود را انتخاب کنید.

### Detailed description

فونتک یک کتابخانه فونت شخصی برای مرورگر Chrome است. فونت‌های دلخواه خود را اضافه کنید و مشخص کنید هر فونت روی کدام سایت یا صفحه نمایش داده شود.

فونتک به‌صورت پیش‌فرض هیچ سایتی را تغییر نمی‌دهد. هر قانون فقط بعد از انتخاب صریح شما ساخته می‌شود و تمام فایل‌ها و تنظیمات روی دستگاه خودتان باقی می‌مانند.

امکانات اصلی:

- افزودن هم‌زمان چند فونت با فرمت‌های WOFF2، WOFF، TTF و OTF
- انتخاب فونت متفاوت برای هر سایت یا URL
- اجرای قانون روی کل دامنه یا فقط یک صفحه مشخص
- تغییر فونت فقط برای نویسه‌های فارسی، عربی و اردو
- حفظ فونت زبان‌های دیگر، آیکون‌ها و قطعه‌های کد
- راست‌به‌چپ کردن اختیاری صفحه‌های انتخاب‌شده
- پشتیبانی از iframeهای هم‌مبدأ و Shadow DOMهای باز
- اعمال زنده و بدون Reload با پردازش غیرمسدودکننده در Gmail و برنامه‌های وب پویا
- توقف موقت تمام قوانین با یک کلید
- دسترسی اختیاری یک‌باره به همه سایت‌ها برای حذف درخواست‌های تکراری مجوز
- ذخیره کاملاً محلی، بدون حساب کاربری، تبلیغات، Analytics یا ارسال داده

محدودیت‌های Chrome:

افزونه‌ها روی صفحه‌های داخلی chrome://، فروشگاه Chrome و متن‌های رسم‌شده داخل Canvas یا تصویر اجرا نمی‌شوند.

### Category

Accessibility

### Language

Persian / فارسی

## Product details — English

### Title

Fontak — Custom Fonts per Website

### Summary

Assign your own Persian, Arabic, or Urdu fonts and optional RTL layout to selected websites and pages.

### Detailed description

Fontak is a local font library for Chrome. Import your own font files and choose exactly which website or page should use each font.

Fontak does not modify every website by default. A rule is created only after the user explicitly selects a font and adds the current website or page. Fonts, rules, and preferences remain on the user's device.

Key features:

- Import multiple WOFF2, WOFF, TTF, or OTF font files
- Assign a different font to each website or page URL
- Apply a rule to an entire domain or one specific page
- Replace only Persian, Arabic, and Urdu Unicode characters
- Preserve fonts used by other languages, icons, and code blocks
- Optionally force RTL direction on selected pages
- Support open Shadow DOM and same-origin iframe content
- Apply changes live without a reload using non-blocking processing on Gmail and dynamic web apps
- Pause every saved rule with one switch
- Optionally grant all-sites access once to avoid future per-site permission prompts
- No account, advertising, analytics, telemetry, or external data transfer

Chrome does not allow extensions to modify internal chrome:// pages, the Chrome Web Store, or text rendered inside images and Canvas elements.

Users are responsible for importing only font files they are licensed to use. Imported fonts are not published or transferred to the developer.

## Privacy practices

### Single purpose description

Fontak lets users apply locally imported font files and optional RTL styling only to websites or page URLs that they explicitly select.

### Permission justification — storage

Required to save extension preferences, font metadata, and the website or page rules explicitly created by the user.

### Permission justification — unlimitedStorage

Required because users can import multiple font files, and their combined local size may exceed Chrome's standard extension storage quota. Font data remains on the user's device.

### Permission justification — activeTab

Required to read the active tab's URL only when the user opens Fontak, so the popup can display and add the current website or page. Access is temporary and begins with the user's explicit action.

### Permission justification — scripting

Required to inject Fontak's packaged font and optional RTL scripts into a website only after the user has explicitly granted access to that origin. Fontak does not download or execute remote code.

### Permission justification — optional host access

By default, Fontak requests access to one `http://` or `https://` origin only when the user clicks the activation button for that website. Users may alternatively enable an explicit one-time all-sites permission from Fontak's settings to avoid future per-site prompts. Even with that optional grant, Fontak modifies only websites or pages that the user saves as rules. Blanket access is never requested during installation.

### Data-use declaration

- Declare **Web browsing activity** because Fontak reads the current page URL to match user-created local rules.
- State that this data is used only for the user-facing font rule feature.
- State that URLs, font files, and settings are stored locally and are never transmitted, sold, shared, used for advertising, or accessed by the developer.
- Do not declare page content, form data, authentication data, financial data, personal communications, location, or health information; Fontak does not collect them.
- Complete every Limited Use certification truthfully.

### Privacy policy URL

`https://YOUR_GITHUB_USERNAME.github.io/fontak/PRIVACY.html`

GitHub Pages باید قبل از ثبت این URL فعال شده باشد.

## Distribution

- Visibility: **Public**
- Regions: **All regions**
- Pricing: **Free**
- Mature content: **No**

## Optional URLs

- Homepage: `https://github.com/YOUR_GITHUB_USERNAME/fontak`
- Support: `https://github.com/YOUR_GITHUB_USERNAME/fontak/issues`
- Privacy: `https://YOUR_GITHUB_USERNAME.github.io/fontak/PRIVACY.html`

## Test instructions for reviewer

1. Open any regular `https://` webpage.
2. Open Fontak and go to the Fonts tab.
3. Import any local TTF, OTF, WOFF, or WOFF2 font file.
4. Return to the Current Site tab, select the imported font, choose Entire Site or This Page Only, and save the rule.
5. Confirm that the selected page uses the imported font.
6. Enable the Persian/Arabic/Urdu-only option and verify that Latin characters retain their original font.
7. Enable RTL and confirm that the saved page direction becomes right-to-left.
8. Remove the rule and confirm that the page returns to its original styles.

No account or test credentials are required.

## GitHub repository

- Repository name: `fontak`
- Description: `A local-first Chrome extension for assigning custom Persian, Arabic and Urdu fonts to selected websites.`
- Visibility: Public
- Suggested topics: `chrome-extension`, `persian-font`, `arabic-font`, `urdu-font`, `rtl`, `manifest-v3`, `accessibility`

## Release

- Tag: `v2.4.0`
- Title: `Fontak v2.4.0 — Vazirmatn by default and security hardening`
- Release notes:

```text
Fontak 2.4.0 bundles Vazirmatn as the default font for new installs and hardens privileged messaging and content-script data exposure.

- Vazirmatn is ready to use without uploading a font file.
- Existing users keep their current default font after upgrading.
- Privileged management messages are accepted only from Fontak's own extension pages.
- Content scripts receive only the display settings they require.
- An explicit extension Content Security Policy is now declared.

Fontak still applies fonts only to URLs explicitly saved by the user.

- Local multi-font library
- Per-site and per-page font rules
- Persian, Arabic and Urdu Unicode filtering
- Optional RTL mode
- Icon and code-font protection
- Non-blocking, incremental DOM processing without a page reload
- Batched live-update handling for Gmail, Google Docs, YouTube, ChatGPT, Gemini, Slack, WhatsApp Web, Telegram Web, X, LinkedIn and Discord
- Root-level RTL that avoids writing inline direction styles across every page element
- No analytics, tracking or external data transfer
- Per-site optional permissions instead of blanket website access
- Optional one-time all-sites permission for users who prefer fewer prompts
```
