const DB_NAME = "persian-font-everywhere";
const DB_VERSION = 1;
const STORE_NAME = "fonts";
const ALL_SITE_PATTERNS = ["https://*/*", "http://*/*"];

const fontCache = new Map();
let cachedLibraryRevision = null;

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

async function readFont(fontId) {
  if (!fontId) return null;
  if (fontCache.has(fontId)) return fontCache.get(fontId);

  const database = await openDatabase();
  const font = await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(fontId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onabort = () => database.close();
  });

  fontCache.set(fontId, font);
  return font;
}

function normalizePageUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return `${url.origin}${url.pathname || "/"}`;
  } catch (_) {
    return null;
  }
}

function originPattern(rawOrigin) {
  const url = new URL(rawOrigin);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Unsupported origin");
  }
  return `${url.protocol}//${url.host}/*`;
}

function originHash(value) {
  function fnv(seed) {
    let hash = seed;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }
  return `${fnv(2166136261)}_${fnv(3339675911)}`;
}

function scriptIds(origin) {
  const suffix = originHash(origin);
  return {
    main: `fontak_main_${suffix}`,
    content: `fontak_content_${suffix}`
  };
}

async function enableOrigin(origin, tabId) {
  const pattern = originPattern(origin);
  const ids = scriptIds(origin);
  const registered = await chrome.scripting.getRegisteredContentScripts();
  const registeredIds = new Set(registered.map((script) => script.id));
  const missing = [];

  if (!registeredIds.has(ids.main)) {
    missing.push({
      id: ids.main,
      matches: [pattern],
      js: ["page-bridge.js"],
      runAt: "document_start",
      allFrames: true,
      matchOriginAsFallback: true,
      persistAcrossSessions: true,
      world: "MAIN"
    });
  }

  if (!registeredIds.has(ids.content)) {
    missing.push({
      id: ids.content,
      matches: [pattern],
      js: ["content.js"],
      runAt: "document_start",
      allFrames: true,
      matchOriginAsFallback: true,
      persistAcrossSessions: true,
      world: "ISOLATED"
    });
  }

  if (missing.length) await chrome.scripting.registerContentScripts(missing);

  if (Number.isInteger(tabId)) {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["page-bridge.js"],
      world: "MAIN",
      injectImmediately: true
    });
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["content.js"],
      world: "ISOLATED",
      injectImmediately: true
    });
  }
}

async function unregisterOrigin(origin) {
  const ids = scriptIds(origin);
  const registered = await chrome.scripting.getRegisteredContentScripts();
  const registeredIds = new Set(registered.map((script) => script.id));
  const removable = [ids.main, ids.content].filter((id) => registeredIds.has(id));
  if (removable.length) {
    await chrome.scripting.unregisterContentScripts({ ids: removable });
  }
}

function originsForRule(rule) {
  try {
    if (rule.matchType === "page") return [new URL(rule.value).origin];
    if (rule.value.startsWith("http://") || rule.value.startsWith("https://")) {
      return [new URL(rule.value).origin];
    }
    if (/^[a-z0-9.-]+(?::\d+)?$/i.test(rule.value)) {
      return [`https://${rule.value}`, `http://${rule.value}`];
    }
  } catch (_) {
    // Ignore malformed legacy rules.
  }
  return [];
}

async function reconcileRuleOrigins() {
  const { siteRules } = await chrome.storage.local.get({ siteRules: [] });
  const origins = new Set(siteRules.flatMap(originsForRule));

  for (const origin of origins) {
    const granted = await chrome.permissions.contains({
      origins: [originPattern(origin)]
    });
    if (granted) await enableOrigin(origin);
    else await unregisterOrigin(origin);
  }
}

async function disableOrigin(origin) {
  await unregisterOrigin(origin);
  const allSitesGranted = await chrome.permissions.contains({
    origins: ALL_SITE_PATTERNS
  });
  if (!allSitesGranted) {
    await chrome.permissions.remove({ origins: [originPattern(origin)] });
  }
}

function findRule(rules, rawUrl) {
  const normalizedPage = normalizePageUrl(rawUrl);
  if (!normalizedPage) return null;

  const url = new URL(normalizedPage);
  const pageRule = rules.find(
    (rule) => rule.matchType === "page" && rule.value === normalizedPage
  );
  if (pageRule) return pageRule;

  return rules.find(
    (rule) =>
      rule.matchType === "site" &&
      (rule.value === url.origin || rule.value === url.hostname)
  ) || null;
}

async function getPayload(sender) {
  const settings = await chrome.storage.local.get({
    enabled: true,
    fonts: [],
    siteRules: [],
    fontLibraryRevision: 0,
    protectIcons: true,
    protectCode: true,
    arabicScriptOnly: false,
    forceRtl: false
  });

  if (!settings.enabled) return { enabled: false, settings };

  const topLevelUrl = sender.tab?.url || sender.url;
  const rule = findRule(settings.siteRules, topLevelUrl);
  if (!rule) return { enabled: false, settings };

  const normalizedPage = normalizePageUrl(topLevelUrl);
  const originGranted = normalizedPage && await chrome.permissions.contains({
    origins: [originPattern(new URL(normalizedPage).origin)]
  });
  if (!originGranted) return { enabled: false, settings, rule };

  if (cachedLibraryRevision !== settings.fontLibraryRevision) {
    fontCache.clear();
    cachedLibraryRevision = settings.fontLibraryRevision;
  }

  const fontMeta = settings.fonts.find((font) => font.id === rule.fontId);
  if (!fontMeta) {
    return { enabled: false, settings, rule, error: "FONT_META_NOT_FOUND" };
  }

  const font = await readFont(rule.fontId);
  if (!font?.dataUrl) {
    return { enabled: false, settings, rule, error: "FONT_DATA_NOT_FOUND" };
  }

  return {
    enabled: true,
    settings,
    rule,
    font: {
      id: font.id,
      dataUrl: font.dataUrl,
      format: font.format,
      name: font.name
    }
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "FONTAK_ENABLE_ORIGIN") {
    enableOrigin(message.origin, message.tabId)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error("Fontak:", error);
        sendResponse({ ok: false, error: "ENABLE_ORIGIN_FAILED" });
      });
    return true;
  }

  if (message?.type === "FONTAK_DISABLE_ORIGIN") {
    disableOrigin(message.origin)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error("Fontak:", error);
        sendResponse({ ok: false, error: "DISABLE_ORIGIN_FAILED" });
      });
    return true;
  }

  if (message?.type === "FONTAK_SYNC_RULE_ORIGINS") {
    reconcileRuleOrigins()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error("Fontak:", error);
        sendResponse({ ok: false, error: "SYNC_ORIGINS_FAILED" });
      });
    return true;
  }

  if (message?.type !== "PFE_GET_FONT") return false;

  getPayload(sender)
    .then(sendResponse)
    .catch((error) => {
      console.error("Fontak:", error);
      sendResponse({ enabled: false, error: "READ_FAILED" });
    });

  return true;
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.fontLibraryRevision) {
    cachedLibraryRevision = null;
    fontCache.clear();
  }
});
