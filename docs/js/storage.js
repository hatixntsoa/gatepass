(function () {
  "use strict";
  const KEY = "gatepass-v1";
  const TTL = 4 * 60 * 60 * 1000;
  function load() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!value || !value.createdAt || Date.now() - value.createdAt >= TTL) {
        localStorage.removeItem(KEY);
        return {};
      }
      return value;
    } catch (_) {
      localStorage.removeItem(KEY);
      return {};
    }
  }
  function save(state) {
    try {
      if (!state.createdAt) state.createdAt = Date.now();
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (_) {}
  }
  window.GPStorage = { load, save, ttl: TTL };
})();
