const DB_NAME = "persian-font-everywhere";
const DB_VERSION = 1;
const STORE_NAME = "fonts";
const LEGACY_FONT_KEY = "active-font";
const MAX_FONT_SIZE = 10 * 1024 * 1024;
const ALL_SITE_PATTERNS = ["https://*/*", "http://*/*"];
const BUILTIN_FONT_ID = "fontak-vazirmatn";
const BUILTIN_FONT_PATH = "assets/Vazirmatn-Regular.woff2";
const BUILTIN_FONT_META = {
  id: BUILTIN_FONT_ID,
  name: "وزیرمتن",
  fileName: "Vazirmatn-Regular.woff2",
  size: 50684,
  format: "woff2",
  updatedAt: 0,
  builtIn: true
};

const FONT_TYPES = {
  woff2: { mime: "font/woff2", format: "woff2" },
  woff: { mime: "font/woff", format: "woff" },
  ttf: { mime: "font/ttf", format: "truetype" },
  otf: { mime: "font/otf", format: "opentype" }
};

const elements = {
  enabled: document.querySelector("#enabled"),
  fontCount: document.querySelector("#fontCount"),
  ruleCount: document.querySelector("#ruleCount"),
  restrictedSite: document.querySelector("#restrictedSite"),
  currentSiteContent: document.querySelector("#currentSiteContent"),
  siteInitial: document.querySelector("#siteInitial"),
  siteHost: document.querySelector("#siteHost"),
  sitePath: document.querySelector("#sitePath"),
  siteBadge: document.querySelector("#siteBadge"),
  siteFont: document.querySelector("#siteFont"),
  scopeSite: document.querySelector("#scopeSite"),
  scopePage: document.querySelector("#scopePage"),
  sitePreview: document.querySelector("#sitePreview"),
  saveSite: document.querySelector("#saveSite"),
  removeSite: document.querySelector("#removeSite"),
  arabicScriptOnly: document.querySelector("#arabicScriptOnly"),
  forceRtl: document.querySelector("#forceRtl"),
  allSitesAccess: document.querySelector("#allSitesAccess"),
  protectIcons: document.querySelector("#protectIcons"),
  protectCode: document.querySelector("#protectCode"),
  pickFont: document.querySelector("#pickFont"),
  fontFile: document.querySelector("#fontFile"),
  fontList: document.querySelector("#fontList"),
  emptyFonts: document.querySelector("#emptyFonts"),
  ruleList: document.querySelector("#ruleList"),
  emptyRules: document.querySelector("#emptyRules"),
  status: document.querySelector("#status")
};

let state = null;
let currentPage = null;
let editingRuleId = null;
let allSitesAccess = false;
const previewFamilies = new Map();
const previewObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const glyph = entry.target;
    previewObserver.unobserve(glyph);
    loadPreviewFont(glyph.dataset.previewFont)
      .then((family) => {
        if (family) glyph.style.fontFamily = `\"${family}\"`;
      })
      .catch(() => {});
  }
});

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getFontRecord(fontId) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(fontId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onabort = () => database.close();
  });
}

async function putFontRecord(font) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(font);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => database.close();
  });
}

async function deleteFontRecord(fontId) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(fontId);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => database.close();
  });
}

function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
}

function toPersianNumber(value) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[digit]);
}

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("error", isError);
}

function normalizePage(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return {
      origin: url.origin,
      hostname: url.hostname,
      path: url.pathname || "/",
      pageKey: `${url.origin}${url.pathname || "/"}`,
      siteKey: url.origin
    };
  } catch (_) {
    return null;
  }
}

function findMatchingRule() {
  if (!currentPage) return null;
  return state.siteRules.find(
    (rule) => rule.matchType === "page" && rule.value === currentPage.pageKey
  ) || state.siteRules.find(
    (rule) =>
      rule.matchType === "site" &&
      (rule.value === currentPage.siteKey || rule.value === currentPage.hostname)
  ) || null;
}

function ruleOrigin(rule) {
  try {
    if (rule.matchType === "page") return new URL(rule.value).origin;
    if (rule.value.startsWith("http://") || rule.value.startsWith("https://")) {
      return new URL(rule.value).origin;
    }
  } catch (_) {
    return null;
  }
  return null;
}

function hasRuleForOrigin(origin) {
  return state.siteRules.some((rule) => ruleOrigin(rule) === origin);
}

async function disableOriginIfUnused(origin) {
  if (!origin || hasRuleForOrigin(origin)) return;
  await chrome.runtime.sendMessage({
    type: "FONTAK_DISABLE_ORIGIN",
    origin
  });
}

async function migrateLegacyFont() {
  const legacyState = await chrome.storage.local.get({
    fonts: [],
    fontMeta: null,
    defaultFontId: null
  });
  if (legacyState.fonts.length || !legacyState.fontMeta) return;

  const legacyFont = await getFontRecord(LEGACY_FONT_KEY);
  if (!legacyFont?.dataUrl) return;

  const id = `font-${crypto.randomUUID()}`;
  const meta = { ...legacyState.fontMeta, id };
  await putFontRecord({ ...legacyFont, ...meta, id });
  await deleteFontRecord(LEGACY_FONT_KEY);
  await chrome.storage.local.set({
    fonts: [meta],
    defaultFontId: id,
    fontLibraryRevision: Date.now()
  });
  await chrome.storage.local.remove(["fontMeta", "fontRevision"]);
}

async function ensureBuiltinFont() {
  const saved = await chrome.storage.local.get({
    fonts: [],
    defaultFontId: null,
    fontLibraryRevision: 0
  });
  const existingRecord = await getFontRecord(BUILTIN_FONT_ID);

  if (!existingRecord?.dataUrl) {
    const response = await fetch(chrome.runtime.getURL(BUILTIN_FONT_PATH));
    if (!response.ok) throw new Error("Bundled Vazirmatn font is unavailable");
    const blob = await response.blob();
    const dataUrl = await readAsDataUrl(blob);
    await putFontRecord({ ...BUILTIN_FONT_META, size: blob.size, dataUrl });
  }

  const existingMeta = saved.fonts.find((font) => font.id === BUILTIN_FONT_ID);
  const fonts = existingMeta
    ? saved.fonts.map((font) => font.id === BUILTIN_FONT_ID
      ? { ...font, ...BUILTIN_FONT_META, builtIn: true }
      : font)
    : [BUILTIN_FONT_META, ...saved.fonts];
  const defaultFontId = saved.defaultFontId || BUILTIN_FONT_ID;
  const metadataChanged = !existingMeta || !existingMeta.builtIn;
  const defaultChanged = defaultFontId !== saved.defaultFontId;

  if (metadataChanged || defaultChanged || !existingRecord?.dataUrl) {
    await chrome.storage.local.set({
      fonts,
      defaultFontId,
      fontLibraryRevision: Date.now()
    });
  }
}

async function loadState() {
  state = await chrome.storage.local.get({
    enabled: true,
    fonts: [],
    defaultFontId: null,
    siteRules: [],
    fontLibraryRevision: 0,
    protectIcons: true,
    protectCode: true,
    arabicScriptOnly: false,
    forceRtl: false
  });
}

async function loadCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentPage = normalizePage(tab?.url || "");
  if (currentPage) {
    currentPage.tabId = tab.id;
    currentPage.permissionGranted = await chrome.permissions.contains({
      origins: [`${currentPage.origin}/*`]
    });
  }
}

async function loadAllSitesAccess() {
  allSitesAccess = await chrome.permissions.contains({
    origins: ALL_SITE_PATTERNS
  });
}

async function loadPreviewFont(fontId) {
  if (!fontId) return null;
  if (previewFamilies.has(fontId)) return previewFamilies.get(fontId);

  const record = await getFontRecord(fontId);
  if (!record?.dataUrl) return null;
  const family = `FontakPreview_${fontId.replace(/[^a-zA-Z0-9_]/g, "_")}`;
  const face = new FontFace(family, `url(\"${record.dataUrl}\")`);
  await face.load();
  document.fonts.add(face);
  previewFamilies.set(fontId, family);
  return family;
}

async function updateSitePreview() {
  const family = await loadPreviewFont(elements.siteFont.value).catch(() => null);
  elements.sitePreview.style.fontFamily = family
    ? `\"${family}\", Vazirmatn, sans-serif`
    : "Vazirmatn, sans-serif";
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });
}

function renderSite() {
  elements.restrictedSite.hidden = Boolean(currentPage);
  elements.currentSiteContent.hidden = !currentPage;
  if (!currentPage) return;

  const rule = findMatchingRule();
  const ready = Boolean(rule && currentPage.permissionGranted);
  editingRuleId = rule?.id || null;
  elements.siteHost.textContent = currentPage.hostname;
  elements.sitePath.textContent = currentPage.path;
  elements.siteInitial.textContent = currentPage.hostname.charAt(0).toUpperCase();
  elements.siteBadge.textContent = ready ? "فعال" : rule ? "نیاز به اجازه" : "غیرفعال";
  elements.siteBadge.classList.toggle("active", ready);
  elements.removeSite.hidden = !rule;
  elements.saveSite.textContent = ready
    ? "ذخیره تغییرات"
    : rule
      ? "اعطای اجازه و فعال‌سازی"
      : "فعال‌کردن برای این سایت";

  elements.siteFont.replaceChildren();
  if (!state.fonts.length) {
    elements.siteFont.append(new Option("اول یک فونت اضافه کن", ""));
    elements.siteFont.disabled = true;
    elements.saveSite.disabled = true;
  } else {
    for (const font of state.fonts) {
      elements.siteFont.append(new Option(font.name, font.id));
    }
    elements.siteFont.disabled = false;
    elements.saveSite.disabled = false;
    elements.siteFont.value = rule?.fontId || state.defaultFontId || state.fonts[0].id;
  }

  elements.scopePage.checked = rule?.matchType === "page";
  elements.scopeSite.checked = !elements.scopePage.checked;
  updateSitePreview();
}

function renderFonts() {
  elements.fontCount.textContent = toPersianNumber(state.fonts.length);
  elements.emptyFonts.hidden = state.fonts.length > 0;
  previewObserver.disconnect();
  elements.fontList.replaceChildren();

  for (const font of state.fonts) {
    const item = document.createElement("article");
    item.className = "list-item";

    const glyph = document.createElement("span");
    glyph.className = "item-glyph";
    glyph.textContent = "آ";
    glyph.dataset.previewFont = font.id;

    const copy = document.createElement("div");
    copy.className = "item-copy";
    const name = document.createElement("strong");
    name.textContent = font.name;
    const info = document.createElement("small");
    const usageCount = state.siteRules.filter((rule) => rule.fontId === font.id).length;
    info.textContent = `${formatBytes(font.size)} · ${toPersianNumber(usageCount)} آدرس`;
    copy.append(name, info);

    let action;
    if (font.builtIn) {
      action = document.createElement("span");
      action.className = "builtin-label";
      action.textContent = "داخلی";
    } else {
      action = document.createElement("button");
      action.className = "item-action";
      action.type = "button";
      action.dataset.deleteFont = font.id;
      action.title = "حذف فونت";
      action.setAttribute("aria-label", `حذف ${font.name}`);
      action.textContent = "×";
    }

    item.append(glyph, copy, action);
    elements.fontList.append(item);
    previewObserver.observe(glyph);
  }
}

function renderRules() {
  elements.ruleCount.textContent = toPersianNumber(state.siteRules.length);
  elements.emptyRules.hidden = state.siteRules.length > 0;
  elements.ruleList.replaceChildren();
  const fontMap = new Map(state.fonts.map((font) => [font.id, font.name]));

  for (const rule of state.siteRules) {
    const item = document.createElement("article");
    item.className = "list-item";

    const glyph = document.createElement("span");
    glyph.className = "item-glyph";
    glyph.textContent = rule.matchType === "page" ? "↳" : "◎";

    const copy = document.createElement("div");
    copy.className = "item-copy";
    const name = document.createElement("strong");
    name.textContent = rule.label;
    const info = document.createElement("small");
    info.textContent = `${rule.matchType === "page" ? "فقط همین صفحه" : "کل سایت"} · ${fontMap.get(rule.fontId) || "فونت حذف‌شده"}`;
    copy.append(name, info);

    const remove = document.createElement("button");
    remove.className = "item-action";
    remove.type = "button";
    remove.dataset.deleteRule = rule.id;
    remove.title = "حذف آدرس";
    remove.setAttribute("aria-label", `حذف ${rule.label}`);
    remove.textContent = "×";

    item.append(glyph, copy, remove);
    elements.ruleList.append(item);
  }
}

function renderSettings() {
  elements.enabled.checked = state.enabled;
  elements.arabicScriptOnly.checked = state.arabicScriptOnly;
  elements.forceRtl.checked = state.forceRtl;
  elements.allSitesAccess.checked = allSitesAccess;
  elements.protectIcons.checked = state.protectIcons;
  elements.protectCode.checked = state.protectCode;
}

function render() {
  renderSettings();
  renderSite();
  renderFonts();
  renderRules();
}

async function addFont(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const type = FONT_TYPES[extension];
  if (!type) throw new Error(`${file.name}: فرمت پشتیبانی نمی‌شود.`);
  if (!file.size || file.size > MAX_FONT_SIZE) {
    throw new Error(`${file.name}: حجم باید کمتر از ۱۰ مگابایت باشد.`);
  }

  const typedBlob = new Blob([file], { type: type.mime });
  const objectUrl = URL.createObjectURL(typedBlob);
  try {
    const validationFace = new FontFace("FontakValidation", `url(\"${objectUrl}\")`);
    await validationFace.load();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const id = `font-${crypto.randomUUID()}`;
  const meta = {
    id,
    name: file.name.replace(/\.[^.]+$/, ""),
    fileName: file.name,
    size: file.size,
    format: type.format,
    updatedAt: Date.now()
  };
  const dataUrl = await readAsDataUrl(typedBlob);
  await putFontRecord({ ...meta, dataUrl });
  state.fonts.push(meta);
  state.defaultFontId = id;
}

async function handleFontFiles(files) {
  setStatus("");
  let added = 0;
  const errors = [];
  for (const file of files) {
    try {
      await addFont(file);
      added += 1;
    } catch (error) {
      console.error(error);
      errors.push(error.message || `${file.name}: ناموفق`);
    }
  }

  if (added) {
    state.fontLibraryRevision = Date.now();
    await chrome.storage.local.set({
      fonts: state.fonts,
      defaultFontId: state.defaultFontId,
      fontLibraryRevision: state.fontLibraryRevision
    });
    render();
  }

  if (errors.length) {
    setStatus(`${toPersianNumber(added)} فونت اضافه شد؛ ${errors[0]}`, true);
  } else {
    setStatus(`${toPersianNumber(added)} فونت به کتابخانه اضافه شد.`);
  }
}

async function saveCurrentSite() {
  if (!currentPage || !elements.siteFont.value) return;
  const granted = await chrome.permissions.request({
    origins: [`${currentPage.origin}/*`]
  });
  if (!granted) {
    setStatus("بدون اجازه این سایت، فونتک نمی‌تواند فونت را اعمال کند.", true);
    return;
  }
  currentPage.permissionGranted = true;

  const matchType = elements.scopePage.checked ? "page" : "site";
  const value = matchType === "page" ? currentPage.pageKey : currentPage.siteKey;
  const label = matchType === "page"
    ? `${currentPage.hostname}${currentPage.path}`
    : currentPage.hostname;

  state.siteRules = state.siteRules.filter((rule) => {
    if (rule.id === editingRuleId) return false;
    return !(rule.matchType === matchType && rule.value === value);
  });
  const rule = {
    id: editingRuleId || `rule-${crypto.randomUUID()}`,
    matchType,
    value,
    label,
    fontId: elements.siteFont.value,
    addedAt: Date.now()
  };
  state.siteRules.unshift(rule);
  state.defaultFontId = rule.fontId;
  state.enabled = true;
  await chrome.storage.local.set({
    siteRules: state.siteRules,
    defaultFontId: state.defaultFontId,
    enabled: true
  });
  const activation = await chrome.runtime.sendMessage({
    type: "FONTAK_ENABLE_ORIGIN",
    origin: currentPage.origin,
    tabId: currentPage.tabId
  });
  if (!activation?.ok) {
    setStatus("اجازه ذخیره شد، اما اجرای فونت روی صفحه ناموفق بود.", true);
    return;
  }
  editingRuleId = rule.id;
  render();
  setStatus(matchType === "page" ? "فونت برای همین صفحه ذخیره شد." : "فونت برای کل سایت ذخیره شد.");
}

async function removeCurrentRule() {
  if (!editingRuleId) return;
  const removedRule = state.siteRules.find((rule) => rule.id === editingRuleId);
  const origin = ruleOrigin(removedRule) || currentPage?.origin;
  state.siteRules = state.siteRules.filter((rule) => rule.id !== editingRuleId);
  await chrome.storage.local.set({ siteRules: state.siteRules });
  await disableOriginIfUnused(origin);
  if (origin === currentPage?.origin && !hasRuleForOrigin(origin)) {
    currentPage.permissionGranted = false;
  }
  editingRuleId = null;
  render();
  setStatus("قانون این آدرس حذف شد.");
}

async function removeRule(ruleId) {
  const removedRule = state.siteRules.find((rule) => rule.id === ruleId);
  const origin = ruleOrigin(removedRule);
  state.siteRules = state.siteRules.filter((rule) => rule.id !== ruleId);
  await chrome.storage.local.set({ siteRules: state.siteRules });
  await disableOriginIfUnused(origin);
  render();
  setStatus("آدرس از فهرست حذف شد.");
}

async function removeFont(fontId) {
  const font = state.fonts.find((item) => item.id === fontId);
  if (!font || font.builtIn) return;
  const usageCount = state.siteRules.filter((rule) => rule.fontId === fontId).length;
  const warning = usageCount
    ? `این فونت روی ${toPersianNumber(usageCount)} آدرس فعال است. فونت و آن قوانین حذف شوند؟`
    : `فونت «${font.name}» حذف شود؟`;
  if (!confirm(warning)) return;

  const affectedOrigins = new Set(
    state.siteRules
      .filter((rule) => rule.fontId === fontId)
      .map(ruleOrigin)
      .filter(Boolean)
  );
  await deleteFontRecord(fontId);
  state.fonts = state.fonts.filter((item) => item.id !== fontId);
  state.siteRules = state.siteRules.filter((rule) => rule.fontId !== fontId);
  if (state.defaultFontId === fontId) {
    state.defaultFontId = state.fonts[0]?.id || null;
  }
  state.fontLibraryRevision = Date.now();
  previewFamilies.delete(fontId);
  await chrome.storage.local.set({
    fonts: state.fonts,
    siteRules: state.siteRules,
    defaultFontId: state.defaultFontId,
    fontLibraryRevision: state.fontLibraryRevision
  });
  for (const origin of affectedOrigins) await disableOriginIfUnused(origin);
  render();
  setStatus("فونت حذف شد.");
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

elements.enabled.addEventListener("change", async () => {
  state.enabled = elements.enabled.checked;
  await chrome.storage.local.set({ enabled: state.enabled });
  setStatus(state.enabled ? "همه قوانین فعال شدند." : "همه قوانین موقتاً متوقف شدند.");
});

elements.allSitesAccess.addEventListener("change", async () => {
  if (elements.allSitesAccess.checked) {
    const granted = await chrome.permissions.request({
      origins: ALL_SITE_PATTERNS
    });
    if (!granted) {
      allSitesAccess = false;
      elements.allSitesAccess.checked = false;
      setStatus("دسترسی همه سایت‌ها تأیید نشد.", true);
      return;
    }

    allSitesAccess = true;
    const sync = await chrome.runtime.sendMessage({
      type: "FONTAK_SYNC_RULE_ORIGINS"
    });
    if (currentPage && findMatchingRule()) {
      currentPage.permissionGranted = true;
      await chrome.runtime.sendMessage({
        type: "FONTAK_ENABLE_ORIGIN",
        origin: currentPage.origin,
        tabId: currentPage.tabId
      });
    }
    render();
    setStatus(sync?.ok
      ? "دسترسی یک‌باره فعال شد؛ دیگر اجازه جداگانه نمی‌پرسد."
      : "دسترسی فعال شد؛ صفحه‌های باز را یک‌بار تازه‌سازی کن.");
    return;
  }

  const confirmed = confirm(
    "دسترسی یک‌باره لغو شود؟ سایت‌هایی که مجوز جداگانه ندارند دوباره اجازه خواهند خواست."
  );
  if (!confirmed) {
    elements.allSitesAccess.checked = true;
    return;
  }

  await chrome.permissions.remove({ origins: ALL_SITE_PATTERNS });
  allSitesAccess = false;
  const sync = await chrome.runtime.sendMessage({
    type: "FONTAK_SYNC_RULE_ORIGINS"
  });
  await chrome.storage.local.set({ permissionRevision: Date.now() });
  if (currentPage) {
    currentPage.permissionGranted = await chrome.permissions.contains({
      origins: [`${currentPage.origin}/*`]
    });
  }
  render();
  setStatus(sync?.ok
    ? "دسترسی همه سایت‌ها لغو شد."
    : "دسترسی لغو شد؛ صفحه‌های باز را یک‌بار تازه‌سازی کن.");
});

elements.siteFont.addEventListener("change", updateSitePreview);
elements.saveSite.addEventListener("click", saveCurrentSite);
elements.removeSite.addEventListener("click", removeCurrentRule);
elements.pickFont.addEventListener("click", () => elements.fontFile.click());

elements.fontFile.addEventListener("change", async () => {
  const files = [...elements.fontFile.files];
  elements.fontFile.value = "";
  if (files.length) await handleFontFiles(files);
});

elements.fontList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-font]");
  if (button) removeFont(button.dataset.deleteFont);
});

elements.ruleList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-rule]");
  if (button) removeRule(button.dataset.deleteRule);
});

for (const [element, key] of [
  [elements.arabicScriptOnly, "arabicScriptOnly"],
  [elements.forceRtl, "forceRtl"],
  [elements.protectIcons, "protectIcons"],
  [elements.protectCode, "protectCode"]
]) {
  element.addEventListener("change", async () => {
    state[key] = element.checked;
    await chrome.storage.local.set({ [key]: element.checked });
    setStatus("تنظیمات ذخیره شد.");
  });
}

async function initialize() {
  await migrateLegacyFont();
  await ensureBuiltinFont();
  await Promise.all([loadState(), loadCurrentPage(), loadAllSitesAccess()]);
  render();
}

initialize().catch((error) => {
  console.error(error);
  setStatus("راه‌اندازی فونتک ناموفق بود.", true);
});
