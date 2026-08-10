(() => {
  if (globalThis.__fontakBridgeLoaded) return;
  globalThis.__fontakBridgeLoaded = true;

  const SHADOW_EVENT = "__persian_font_everywhere_shadow_root__";
  const ENABLE_EVENT = "__fontak_enable_shadow_bridge__";
  const DISABLE_EVENT = "__fontak_disable_shadow_bridge__";
  let originalAttachShadow = null;
  let patchedAttachShadow = null;

  function enableBridge() {
    if (patchedAttachShadow) return;
    originalAttachShadow = Element.prototype.attachShadow;

    patchedAttachShadow = function fontakAttachShadow(init) {
      const root = originalAttachShadow.call(this, init);
      if (init?.mode === "open") {
        queueMicrotask(() => {
          this.dispatchEvent(new CustomEvent(SHADOW_EVENT, { bubbles: true }));
        });
      }
      return root;
    };

    Object.defineProperty(Element.prototype, "attachShadow", {
      configurable: true,
      enumerable: false,
      writable: true,
      value: patchedAttachShadow
    });
  }

  function disableBridge() {
    if (!patchedAttachShadow) return;
    if (Element.prototype.attachShadow === patchedAttachShadow) {
      Object.defineProperty(Element.prototype, "attachShadow", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: originalAttachShadow
      });
    }
    originalAttachShadow = null;
    patchedAttachShadow = null;
  }

  document.addEventListener(ENABLE_EVENT, enableBridge);
  document.addEventListener(DISABLE_EVENT, disableBridge);
})();
