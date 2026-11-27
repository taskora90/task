// live-sync-guard.js
(function () {
  // ১. পুরনো ক্যাশ বা আটকে থাকা CacheStorage পরিষ্কার রাখা (অ্যাপ রিফ্রেশ ছাড়াই নতুন আপডেট পাওয়ার জন্য)
  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (!name.includes("firebase")) {
          caches.delete(name).catch(() => {});
        }
      });
    }).catch(() => {});
  }

  // ২. পুরনো Android WebView অ্যাপে পপ-আপ বন্ধ হয়ে মূল পেজে ফেরার মুহূর্ত শনাক্ত করা
  let trackedTask = null;
  let openedTimestamp = 0;
  let lastHeartbeat = Date.now();

  window.__TK_START_POPUP_GUARD__ = function (taskIndex, startTimeMs) {
    trackedTask = taskIndex;
    openedTimestamp = startTimeMs || Date.now();
    lastHeartbeat = Date.now();
  };

  window.__TK_CLEAR_POPUP_GUARD__ = function () {
    trackedTask = null;
    openedTimestamp = 0;
  };

  function triggerEarlyReturnIfNeeded() {
    if (trackedTask === null || !openedTimestamp) return;
    const elapsed = Date.now() - openedTimestamp;

    // পপ-আপ খোলার ঠিক পরের 300ms বাদ দেওয়া
    if (elapsed < 300) return;

    const taskToCancel = trackedTask;
    trackedTask = null;
    openedTimestamp = 0;

    if (elapsed < 10000) {
      if (typeof window.__TK_CANCEL_EARLY_TASK__ === "function") {
        window.__TK_CANCEL_EARLY_TASK__(taskToCancel);
      }
    }
  }

  // পপ-আপ ওভারলে বন্ধ হয়ে মূল পেজে ইউজার টাচ/ক্লিক বা ফিরে এলেই চেক করবে
  ["pointerdown", "touchstart", "mousedown", "keydown"].forEach((evt) => {
    window.addEventListener(evt, () => {
      if (trackedTask !== null) {
        triggerEarlyReturnIfNeeded();
      }
    }, true);
  });

  // ব্যাকগ্রাউন্ড/ওভারলে থ্রটলিং থেকে মূল পেজ সচল হলেই চেক করবে
  setInterval(() => {
    const now = Date.now();
    const gap = now - lastHeartbeat;
    lastHeartbeat = now;

    // WebView পপ-আপ ওভারলে বা ব্যাকগ্রাউন্ড থেকে ফিরলে টাইমার গ্যাপ তৈরি হয়
    if (trackedTask !== null && gap > 1200) {
      triggerEarlyReturnIfNeeded();
    }
  }, 500);
})();
