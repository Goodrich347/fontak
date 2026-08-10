(() => {
  if (globalThis.__fontakContentLoaded) return;
  globalThis.__fontakContentLoaded = true;

  const STYLE_MARKER = "data-persian-font-everywhere";
  const SHADOW_EVENT = "__persian_font_everywhere_shadow_root__";
  const SHADOW_BRIDGE_ENABLE = "__fontak_enable_shadow_bridge__";
  const SHADOW_BRIDGE_DISABLE = "__fontak_disable_shadow_bridge__";
  const FONT_FAMILY = "__PersianFontEverywhere__";
  const ORIGINAL_FONT_PROPERTY = "--pfe-original-font-family";
  const READY_ATTRIBUTE = "data-pfe-font-ready";
  const SCOPE_ATTRIBUTE = "data-fontak-scope";
  const ARABIC_SCRIPT_RE = /[\u0600-\u06ff\u0750-\u077f\u0870-\u089f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff\u{10e60}-\u{10e7f}\u{10ec0}-\u{10eff}\u{1ee00}-\u{1eeff}]/u;
  const ALWAYS_EXCLUDED_SELECTOR = [
    "script",
    "style",
    "noscript",
    "template",
    "svg",
    "math",
    "canvas",
    "video",
    "audio",
    "iframe",
    "object",
    "embed",
    "[aria-hidden='true']",
    "[role='img']"
  ].join(",");
  const CODE_EXCLUSIONS = ["code", "pre", "kbd", "samp"];
  const ICON_EXCLUSIONS = [
    ".material-icons",
    ".material-icons-outlined",
    ".material-icons-round",
    ".material-icons-sharp",
    ".material-symbols",
    ".material-symbols-outlined",
    ".material-symbols-rounded",
    ".material-symbols-sharp",
    "[class^='fa-']",
    "[class*=' fa-']",
    "[class^='icon-']",
    "[class*=' icon-']",
    "[data-icon]"
  ];
  const HIGH_CHURN_HOSTS = new Set([
    "mail.google.com",
    "docs.google.com",
    "www.youtube.com",
    "youtube.com",
    "chatgpt.com",
    "gemini.google.com",
    "app.slack.com",
    "web.whatsapp.com",
    "web.telegram.org",
    "x.com",
    "www.linkedin.com",
    "discord.com"
  ]);
  const SITE_TEXT_TARGETS = {
    "mail.google.com": [".a3s", "input", "textarea", "[contenteditable]"],
    "docs.google.com": [".kix-lineview-content", ".docs-title-input", "[contenteditable]"],
    "www.youtube.com": ["#video-title", "#description", "#content-text", "input", "textarea"],
    "youtube.com": ["#video-title", "#description", "#content-text", "input", "textarea"],
    "chatgpt.com": ["[data-message-author-role]", "textarea", "[contenteditable]"],
    "gemini.google.com": ["message-content", ".message-content", "textarea", "[contenteditable]"],
    "app.slack.com": ["[data-qa='message_content']", "[contenteditable]"],
    "web.whatsapp.com": ["[data-testid='msg-container']", "[contenteditable]"],
    "web.telegram.org": [".message", "[contenteditable]"],
    "x.com": ["[data-testid='tweetText']", "[contenteditable]"],
    "www.linkedin.com": [".feed-shared-update-v2__description", ".comments-comment-item__main-content", "[contenteditable]"],
    "discord.com": ["[class*='messageContent']", "[contenteditable]"]
  };

  const rootObservers = new Map();
  const styledRoots = new Set();
  const rootSheets = new WeakMap();
  let pendingScanRoots = new WeakSet();
  const pendingElementSync = new Set();
  let preparedElements = new WeakSet();
  let inspectedElements = new WeakSet();
  let scanJobs = [];
  let scheduledWork = null;
  let scheduledWorkKind = null;
  let activeCss = "";
  let activeSelective = false;
  let activeSettings = null;
  let activeExclusionSelector = ALWAYS_EXCLUDED_SELECTOR;
  let refreshSequence = 0;
  let workGeneration = 0;

  function escapeCssUrl(value) {
    return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  }

  function buildExclusionSelector(settings) {
    const selectors = [ALWAYS_EXCLUDED_SELECTOR];
    if (settings?.protectCode) selectors.push(...CODE_EXCLUSIONS);
    if (settings?.protectIcons) selectors.push(...ICON_EXCLUSIONS);
    return selectors.join(",");
  }

  function getExclusionSelector(settings = activeSettings) {
    return settings === activeSettings
      ? activeExclusionSelector
      : buildExclusionSelector(settings);
  }

  function exclusionNotSelectors(settings) {
    return getExclusionSelector(settings)
      .split(",")
      .map((selector) => selector.trim())
      .filter(Boolean)
      .map((selector) => `:not(${selector}):not(${selector} *)`)
      .join("");
  }

  function scopedSelector(selector) {
    return `body[${SCOPE_ATTRIBUTE}][${SCOPE_ATTRIBUTE}][${SCOPE_ATTRIBUTE}][${SCOPE_ATTRIBUTE}] ${selector}`;
  }

  function buildCss(font, settings) {
    const css = [];
    const exclusions = exclusionNotSelectors(settings);
    const popularTargets = SITE_TEXT_TARGETS[location.hostname] || [];

    if (font) {
      const selective = Boolean(settings.arabicScriptOnly);
      const fallback = selective
        ? `var(${ORIGINAL_FONT_PROPERTY}, sans-serif)`
        : "sans-serif";
      const format = ["woff2", "woff", "truetype", "opentype"].includes(font.format)
        ? ` format("${font.format}")`
        : "";
      const unicodeRange = selective
        ? "unicode-range: U+0600-06FF, U+0750-077F, U+0870-089F, U+08A0-08FF, U+200C-200F, U+FB50-FDFF, U+FE70-FEFF, U+10E60-10E7F, U+10EC0-10EFF, U+1EE00-1EEFF;"
        : "";

      css.push(`
@font-face {
  font-family: "${FONT_FAMILY}";
  src: url("${escapeCssUrl(font.dataUrl)}")${format};
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  ${unicodeRange}
}`);

      if (selective) {
        const marker = `[${READY_ATTRIBUTE}][${READY_ATTRIBUTE}][${READY_ATTRIBUTE}][${READY_ATTRIBUTE}]`;
        css.push(`
${marker} {
  font-family: "${FONT_FAMILY}", ${fallback} !important;
}

${marker}::before,
${marker}::after,
input${marker}::placeholder,
textarea${marker}::placeholder {
  font-family: "${FONT_FAMILY}", ${fallback} !important;
}`);
      } else {
        const documentElements = scopedSelector(`*${exclusions}`);
        const shadowElements = `:host([${SCOPE_ATTRIBUTE}]) *${exclusions}`;
        const targetSelectors = popularTargets
          .map((selector) => scopedSelector(selector))
          .join(",\n");
        css.push(`
html[${SCOPE_ATTRIBUTE}],
body[${SCOPE_ATTRIBUTE}],
:host([${SCOPE_ATTRIBUTE}]),
${documentElements},
${shadowElements}${targetSelectors ? `,\n${targetSelectors}` : ""} {
  font-family: "${FONT_FAMILY}", ${fallback} !important;
}

${documentElements}::before,
${documentElements}::after,
${shadowElements}::before,
${shadowElements}::after,
${scopedSelector("input")}::placeholder,
${scopedSelector("textarea")}::placeholder {
  font-family: "${FONT_FAMILY}", ${fallback} !important;
}`);
      }
    }

    if (settings.forceRtl) {
      const editorSelectors = popularTargets
        .filter((selector) => selector.includes("contenteditable") || selector === "input" || selector === "textarea")
        .map((selector) => scopedSelector(selector))
        .join(",\n");
      css.push(`
html[${SCOPE_ATTRIBUTE}],
body[${SCOPE_ATTRIBUTE}],
:host([${SCOPE_ATTRIBUTE}]) {
  direction: rtl !important;
}

${scopedSelector("input")},
${scopedSelector("textarea")},
${scopedSelector("[contenteditable='true']")},
${scopedSelector("[contenteditable='plaintext-only']")}${editorSelectors ? `,\n${editorSelectors}` : ""} {
  direction: rtl !important;
  text-align: right !important;
}`);
    }

    return css.join("\n");
  }

  function cleanOriginalFontFamily(value) {
    return value
      .replaceAll(`"${FONT_FAMILY}"`, "")
      .replaceAll(FONT_FAMILY, "")
      .replace(/^\s*,|,\s*$/g, "")
      .replace(/,\s*,/g, ",")
      .trim() || "sans-serif";
  }

  function isHTMLElement(value) {
    return value instanceof HTMLElement;
  }

  function isExcludedElement(element) {
    if (!isHTMLElement(element)) return true;
    const selector = getExclusionSelector();
    return element.matches(selector) || Boolean(element.closest(selector));
  }

  function hasArabicText(value) {
    return Boolean(value && ARABIC_SCRIPT_RE.test(value));
  }

  function directText(element) {
    let value = "";
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) value += child.textContent || "";
    }
    return value;
  }

  function elementArabicContent(element) {
    if (element.matches("input, textarea")) {
      return `${element.value || ""} ${element.placeholder || ""}`;
    }
    if (element.matches("select")) {
      return `${element.value || ""} ${directText(element)}`;
    }
    if (element.matches("option")) return element.textContent || "";
    return directText(element);
  }

  function cleanPreparedElement(element) {
    if (!isHTMLElement(element)) return;
    preparedElements.delete(element);
    if (!element.hasAttribute(READY_ATTRIBUTE)) return;
    element.style.removeProperty(ORIGINAL_FONT_PROPERTY);
    element.removeAttribute(READY_ATTRIBUTE);
  }

  function syncElement(element) {
    if (!activeSelective || !isHTMLElement(element)) {
      cleanPreparedElement(element);
      return;
    }

    if (!hasArabicText(elementArabicContent(element))) {
      cleanPreparedElement(element);
      return;
    }

    if (isExcludedElement(element)) {
      cleanPreparedElement(element);
      return;
    }

    if (preparedElements.has(element)) return;
    const originalFont = cleanOriginalFontFamily(getComputedStyle(element).fontFamily);
    element.style.setProperty(ORIGINAL_FONT_PROPERTY, originalFont);
    element.setAttribute(READY_ATTRIBUTE, "");
    preparedElements.add(element);
  }

  function queueElementForSync(element) {
    if (!activeSelective || !isHTMLElement(element)) return;
    pendingElementSync.add(element);
    scheduleWork();
  }

  function setScope(root, enabled) {
    if (root.nodeType === Node.DOCUMENT_NODE) {
      root.documentElement?.toggleAttribute(SCOPE_ATTRIBUTE, enabled);
      root.body?.toggleAttribute(SCOPE_ATTRIBUTE, enabled);
      return;
    }
    root.host?.toggleAttribute?.(SCOPE_ATTRIBUTE, enabled);
  }

  function cleanupPreparedRoot(root) {
    const elements = root.querySelectorAll?.(`[${READY_ATTRIBUTE}]`) || [];
    for (const element of elements) cleanPreparedElement(element);
    if (root.nodeType === Node.ELEMENT_NODE) cleanPreparedElement(root);
  }

  function cancelScheduledWork() {
    if (scheduledWork === null) return;
    if (scheduledWorkKind === "idle" && typeof cancelIdleCallback === "function") {
      cancelIdleCallback(scheduledWork);
    } else {
      clearTimeout(scheduledWork);
    }
    scheduledWork = null;
    scheduledWorkKind = null;
  }

  function clearWorkQueue() {
    cancelScheduledWork();
    scanJobs = [];
    pendingScanRoots = new WeakSet();
    pendingElementSync.clear();
    workGeneration += 1;
    inspectedElements = new WeakSet();
  }

  function removeStyles() {
    document.dispatchEvent(new CustomEvent(SHADOW_BRIDGE_DISABLE));
    clearWorkQueue();

    for (const observer of rootObservers.values()) observer.disconnect();
    rootObservers.clear();

    for (const root of styledRoots) {
      try {
        cleanupPreparedRoot(root);
        setScope(root, false);
        const sheet = rootSheets.get(root);
        if (sheet && "adoptedStyleSheets" in root) {
          root.adoptedStyleSheets = root.adoptedStyleSheets.filter(
            (candidate) => candidate !== sheet
          );
          rootSheets.delete(root);
        } else {
          const container = root.nodeType === Node.DOCUMENT_NODE
            ? root.documentElement
            : root;
          container?.querySelector?.(`style[${STYLE_MARKER}]`)?.remove();
        }
      } catch (_) {
        // A detached document or shadow root no longer needs cleanup.
      }
    }

    styledRoots.clear();
    preparedElements = new WeakSet();
    activeCss = "";
    activeSelective = false;
    activeSettings = null;
    activeExclusionSelector = ALWAYS_EXCLUDED_SELECTOR;
  }

  function isHighChurnPage() {
    return HIGH_CHURN_HOSTS.has(location.hostname);
  }

  function createWalker(startNode) {
    if (startNode.nodeType === Node.TEXT_NODE) return null;
    return document.createTreeWalker(
      startNode,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node) {
          if (!isHTMLElement(node)) return NodeFilter.FILTER_SKIP;
          return node.matches(getExclusionSelector())
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        }
      }
    );
  }

  function enqueueScan(startNode) {
    if (!activeCss || !startNode || pendingScanRoots.has(startNode)) return;
    if (startNode.nodeType === Node.ELEMENT_NODE && startNode.matches(getExclusionSelector())) {
      return;
    }

    pendingScanRoots.add(startNode);
    scanJobs.push({
      generation: workGeneration,
      pendingRoot: true,
      startNode,
      walker: createWalker(startNode)
    });
    scheduleWork();
  }

  function shouldContinue(deadline, processed) {
    const limit = isHighChurnPage() ? 120 : 280;
    if (processed >= limit) return false;
    if (!deadline) return true;
    return deadline.timeRemaining() > 3 || processed === 0;
  }

  function processElement(element) {
    if (!isHTMLElement(element) || element.matches(getExclusionSelector())) return;

    if (element === document.documentElement || element === document.body) {
      element.toggleAttribute(SCOPE_ATTRIBUTE, true);
    }

    if (element.shadowRoot) styleRoot(element.shadowRoot);
    if (activeSelective && !inspectedElements.has(element)) {
      inspectedElements.add(element);
      syncElement(element);
    }
  }

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      if (!parent) return;
      syncElement(parent);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) processElement(node);
  }

  function nextJobNode(job) {
    if (job.pendingRoot) {
      job.pendingRoot = false;
      return job.startNode;
    }
    return job.walker?.nextNode() || null;
  }

  function processWork(deadline) {
    scheduledWork = null;
    scheduledWorkKind = null;
    let processed = 0;

    while (pendingElementSync.size && shouldContinue(deadline, processed)) {
      const element = pendingElementSync.values().next().value;
      pendingElementSync.delete(element);
      if (element.isConnected) syncElement(element);
      processed += 1;
    }

    while (scanJobs.length && shouldContinue(deadline, processed)) {
      const job = scanJobs[0];
      if (job.generation !== workGeneration) {
        pendingScanRoots.delete(job.startNode);
        scanJobs.shift();
        continue;
      }

      const node = nextJobNode(job);
      if (!node) {
        pendingScanRoots.delete(job.startNode);
        scanJobs.shift();
        continue;
      }

      processNode(node);
      processed += 1;
    }

    if (pendingElementSync.size || scanJobs.length) scheduleWork();
  }

  function scheduleWork() {
    if (scheduledWork !== null || (!pendingElementSync.size && !scanJobs.length)) {
      return;
    }

    if (typeof requestIdleCallback === "function") {
      scheduledWorkKind = "idle";
      scheduledWork = requestIdleCallback(processWork, {
        timeout: isHighChurnPage() ? 120 : 220
      });
      return;
    }

    scheduledWorkKind = "timeout";
    scheduledWork = setTimeout(() => processWork(null), 16);
  }

  function observeRoot(root) {
    if (rootObservers.has(root)) return;

    const observer = new MutationObserver((mutations) => {
      if (!activeCss) return;

      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          queueElementForSync(mutation.target.parentElement);
          continue;
        }

        if (mutation.type !== "childList") continue;
        if (activeSelective && mutation.target instanceof HTMLElement) {
          queueElementForSync(mutation.target);
        }
        for (const node of mutation.addedNodes) enqueueScan(node);
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: activeSelective
    });
    rootObservers.set(root, observer);
  }

  function styleRoot(root) {
    if (!activeCss || !root || styledRoots.has(root)) return;
    setScope(root, true);

    if ("adoptedStyleSheets" in root && typeof CSSStyleSheet !== "undefined") {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(activeCss);
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
      rootSheets.set(root, sheet);
    } else {
      const container = root.nodeType === Node.DOCUMENT_NODE
        ? root.documentElement
        : root;
      if (!container?.appendChild) return;
      const style = document.createElement("style");
      style.setAttribute(STYLE_MARKER, "");
      style.textContent = activeCss;
      container.appendChild(style);
    }

    styledRoots.add(root);
    observeRoot(root);
    enqueueScan(root.nodeType === Node.DOCUMENT_NODE ? root.documentElement : root);
  }

  function handleEditableInput(event) {
    if (!activeSelective) return;
    const target = event.target;
    if (isHTMLElement(target)) queueElementForSync(target);
  }

  async function refresh() {
    const sequence = ++refreshSequence;

    try {
      const payload = await chrome.runtime.sendMessage({ type: "PFE_GET_FONT" });
      if (sequence !== refreshSequence) return;

      if (!payload?.enabled) {
        removeStyles();
        return;
      }

      removeStyles();
      activeSettings = payload.settings;
      activeExclusionSelector = buildExclusionSelector(activeSettings);
      activeSelective = Boolean(payload.font && payload.settings.arabicScriptOnly);
      activeCss = buildCss(payload.font || null, payload.settings);
      if (!activeCss) return;

      document.dispatchEvent(new CustomEvent(SHADOW_BRIDGE_ENABLE));
      styleRoot(document);
    } catch (_) {
      removeStyles();
    }
  }

  document.addEventListener(
    SHADOW_EVENT,
    (event) => {
      if (activeCss && event.target?.shadowRoot) styleRoot(event.target.shadowRoot);
    },
    true
  );
  document.addEventListener("input", handleEditableInput, true);
  document.addEventListener("change", handleEditableInput, true);
  document.addEventListener("compositionend", handleEditableInput, true);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (
      areaName === "local" &&
      [
        "enabled",
        "siteRules",
        "permissionRevision",
        "fontLibraryRevision",
        "protectIcons",
        "protectCode",
        "arabicScriptOnly",
        "forceRtl"
      ].some((key) => key in changes)
    ) {
      refresh();
    }
  });

  refresh();
})();
