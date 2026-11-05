(() => {
  "use strict";
  const config = window.HONESTHOLO || {};
  const source = new URLSearchParams(window.location.search).get("src");
  const validSource = value => /^[a-zA-Z0-9_-]{1,80}$/.test(value || "");
  const src = validSource(source) ? source : "scoreboard";

  // Preserve the arriving campaign across navigation, including a /honestholo/ subpath.
  document.querySelectorAll("a[href]").forEach(link => {
    const url = new URL(link.getAttribute("href"), window.location.href);
    if (url.origin === window.location.origin && /\.(?:html|qmd)$/.test(url.pathname)) {
      url.searchParams.set("src", src);
      link.href = url.href;
    }
  });
  document.querySelectorAll('input[name="src"]').forEach(input => { input.value = src; });

  // The Tally form must itself declare a hidden field named src.
  if (/^[a-zA-Z0-9]{3,80}$/.test(config.tallyFormId || "")) {
    document.querySelectorAll("[data-tally-placeholder]").forEach(panel => {
      const frame = panel.querySelector("iframe");
      const url = new URL(frame.dataset.src);
      url.pathname = "/embed/" + config.tallyFormId;
      url.searchParams.set("src", src);
      frame.src = url.href;
      frame.hidden = false;
      const fallback = panel.querySelector("[data-tally-fallback]");
      url.pathname = "/r/" + config.tallyFormId;
      fallback.href = url.href;
      fallback.hidden = false;
      panel.querySelector("[data-tally-status]").textContent =
        "If the form does not load, open the waitlist below.";
    });
  }

  // Optional same-origin collector; the server must deduplicate visitor_id per copy_version.
  // ponytail: browser-local IDs, cross-device visitor deduplication requires a different protocol.
  if (config.analyticsEndpoint && /^https?:$/.test(window.location.protocol)) {
    const endpoint = new URL(config.analyticsEndpoint, window.location.href);
    if (endpoint.origin !== window.location.origin) return;
    endpoint.searchParams.set("src", src);
    try {
      let visitor = localStorage.getItem("honestholo-visitor");
      if (!visitor) {
        visitor = crypto.randomUUID();
        localStorage.setItem("honestholo-visitor", visitor);
      }
      // Only the two waitlist surfaces enter the demand-test denominator.
      if (!/(?:scoreboard|sell-check)\.html$/.test(window.location.pathname)) return;
      const body = JSON.stringify({event: "waitlist_visit", visitor_id: visitor,
        src, copy_version: config.copyVersion, page: window.location.pathname});
      navigator.sendBeacon(endpoint.href, new Blob([body], {type: "application/json"}));
    } catch (_) {
      // Storage denied: omit the event rather than invent another unique visitor.
    }
  }
})();
