/*
 * Play Store policy for the ServiceSite Android app.
 * The app may show the plan a customer already has. It must not show prices
 * or offer a way to buy, switch, or cancel a plan. Those actions stay on the
 * website.
 */
(function (root) {
  var NOTE_ID = "servicesite-plan-note";
  var INSTALLED = "__servicesitePolicyInstalled";

  function pathOf(loc) {
    var value = "/";
    if (!loc) return value;
    if (typeof loc === "string") value = loc;
    else value = loc.pathname || "/";
    return value.split("?")[0].split("#")[0];
  }

  function isPlan(path) {
    return path === "/dashboard/plan" || path.indexOf("/dashboard/plan/") === 0;
  }

  function isPricing(path) {
    return path === "/pricing" || path.indexOf("/pricing/") === 0;
  }

  function text(el) {
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function hide(el) {
    if (!el || el.nodeType !== 1 || el.id === NOTE_ID) return;
    el.setAttribute("data-servicesite-hidden", "1");
    if (el.style && el.style.setProperty) {
      el.style.setProperty("display", "none", "important");
    } else if (el.style) {
      el.style.display = "none";
    }
    el.setAttribute("aria-hidden", "true");
    if (el.tagName === "A" && el.hasAttribute("href")) {
      el.setAttribute("data-servicesite-href", el.getAttribute("href") || "");
      el.removeAttribute("href");
    }
    if (el.tagName === "BUTTON") el.setAttribute("disabled", "disabled");
  }

  function isPurchaseControl(label, path) {
    var value = label.toLowerCase();
    if (value === "current plan") return true;
    if (value.indexOf("subscribe") === 0) return true;
    if (value.indexOf("switch to") === 0) return true;
    if (value === "cancel plan") return true;
    if (isPricing(path) && (value === "get started" || value === "see plans")) return true;
    return false;
  }

  function isPriceNode(el) {
    var value = text(el);
    if (!value || value.length > 80) return false;
    if (/\/\s*month/i.test(value)) return true;
    if (/[$€£]\s?\d/.test(value)) return true;
    return false;
  }

  function ensureStyle(document) {
    if (document.getElementById("servicesite-policy-style")) return;
    var style = document.createElement("style");
    style.id = "servicesite-policy-style";
    style.textContent =
      "html.servicesite-native [data-servicesite-hidden='1']{display:none!important}" +
      "html.servicesite-native iframe[src*='paddle.com'],html.servicesite-native iframe[src*='paddle.io']{display:none!important}" +
      "html.servicesite-native #servicesite-plan-note{margin:1rem 0 0;border-radius:0.75rem;padding:0.75rem 1rem;font-size:0.875rem;line-height:1.45}";
    (document.head || document.documentElement).appendChild(style);
  }

  function noteCopy(hasPlan) {
    if (hasPlan) {
      return "This is the plan on your account. Buying, switching, or cancelling a plan is done on the ServiceSite website, not in this app.";
    }
    return "No plan is active on this account. Plans are purchased on the ServiceSite website in a browser. This app does not sell plans.";
  }

  function setText(el, value) {
    if (el && text(el) !== value) el.textContent = value;
  }

  function placeNote(document, heading, copy) {
    var note = document.getElementById(NOTE_ID);
    if (!note) {
      note = document.createElement("p");
      note.id = NOTE_ID;
      note.setAttribute("role", "note");
      if (heading && heading.parentNode) heading.insertAdjacentElement("afterend", note);
      else if (document.body) document.body.insertBefore(note, document.body.firstChild);
    }
    setText(note, copy);
  }

  function applyStorePolicy(document, loc) {
    var path = pathOf(loc);
    document.documentElement.classList.add("servicesite-native");
    ensureStyle(document);

    var pricingLinks = document.querySelectorAll("a[href='/pricing'], a[href^='/pricing?']");
    for (var i = 0; i < pricingLinks.length; i++) hide(pricingLinks[i]);

    var frames = document.querySelectorAll("iframe");
    for (var f = 0; f < frames.length; f++) {
      var src = frames[f].getAttribute("src") || "";
      if (src.indexOf("paddle.com") !== -1 || src.indexOf("paddle.io") !== -1) hide(frames[f]);
    }

    if (!isPlan(path) && !isPricing(path)) return { path: path, mode: "pass" };

    var controls = document.querySelectorAll("button, a");
    for (var c = 0; c < controls.length; c++) {
      if (isPurchaseControl(text(controls[c]), path)) hide(controls[c]);
    }

    var blocks = document.querySelectorAll("p, span");
    for (var p = 0; p < blocks.length; p++) {
      if (blocks[p].id === NOTE_ID) continue;
      var blockText = text(blocks[p]);
      if (isPriceNode(blocks[p])) hide(blocks[p]);
      if (/billed monthly|upgrading charges|charged the difference|downgrading keeps/i.test(blockText)) {
        hide(blocks[p]);
      }
    }

    var metas = document.querySelectorAll("meta[name='description'], meta[property='og:description'], meta[name='twitter:description']");
    for (var m = 0; m < metas.length; m++) {
      var content = metas[m].getAttribute("content") || "";
      if (/[$€£]\s?\d/.test(content)) metas[m].setAttribute("content", "ServiceSite plans are managed on the website.");
    }

    var cards = document.querySelectorAll("div.rounded-2xl");
    var current = null;
    for (var k = 0; k < cards.length; k++) {
      var cardText = text(cards[k]).toLowerCase();
      var className = String(cards[k].className || "");
      if (cardText.indexOf("current plan") !== -1 || className.indexOf("border-accent") !== -1) current = cards[k];
    }

    if (isPlan(path)) {
      if (current) {
        for (var n = 0; n < cards.length; n++) if (cards[n] !== current) hide(cards[n]);
      } else {
        for (var q = 0; q < cards.length; q++) hide(cards[q]);
      }
      var heading = document.querySelector("h1");
      if (heading && /plan/i.test(text(heading))) setText(heading, "Your plan");
      placeNote(document, heading, noteCopy(!!current));
      return { path: path, mode: current ? "current" : "none" };
    }

    var pricingHeading = document.querySelector("h1");
    if (pricingHeading && /plan/i.test(text(pricingHeading))) setText(pricingHeading, "Plans");
    placeNote(
      document,
      pricingHeading,
      "Prices and purchases are not available in the app. Subscribe on the ServiceSite website in a browser."
    );
    return { path: path, mode: "pricing" };
  }

  function installStorePolicy(window) {
    if (!window) return;
    if (window[INSTALLED]) {
      if (window.__servicesiteApplyPolicy) window.__servicesiteApplyPolicy();
      return;
    }
    window[INSTALLED] = true;

    function apply() {
      try {
        applyStorePolicy(window.document, window.location);
      } catch (err) {
        /* The website remains usable if a future redesign moves these elements. */
      }
    }

    window.__servicesiteApplyPolicy = apply;
    window.document.addEventListener(
      "click",
      function (event) {
        var target = event.target;
        var el = target && target.closest ? target.closest("a, button") : null;
        if (!el) return;
        var path = (window.location && window.location.pathname) || "/";
        var href = (el.getAttribute("href") || "") + (el.getAttribute("data-servicesite-href") || "");
        if (href.indexOf("paddle.com") !== -1 || href.indexOf("paddle.io") !== -1) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if ((isPlan(path) || isPricing(path)) && isPurchaseControl(text(el), path)) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );

    apply();
    if (typeof window.MutationObserver === "function") {
      var pending = false;
      var observer = new window.MutationObserver(function () {
        if (pending) return;
        pending = true;
        var schedule = window.requestAnimationFrame || function (cb) { return window.setTimeout(cb, 16); };
        schedule(function () {
          pending = false;
          apply();
        });
      });
      observer.observe(window.document.documentElement, { childList: true, subtree: true });
    }
  }

  root.applyStorePolicy = applyStorePolicy;
  root.installStorePolicy = installStorePolicy;

  if (typeof window !== "undefined" && window.document) installStorePolicy(window);
})(typeof globalThis !== "undefined" ? globalThis : this);
