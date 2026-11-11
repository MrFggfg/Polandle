(function (root) {
    "use strict";

    const modules = root.PolandleModules = root.PolandleModules || {};
    const PREFIX = "polandle:session:v1";

    function dayKey() {
        return new Date().toISOString().slice(0, 10);
    }

    function key(category, mode) {
        const day = mode === "daily" ? `:${dayKey()}` : "";
        return `${PREFIX}:${category}:${mode}${day}`;
    }

    function load(category, mode) {
        try {
            const value = JSON.parse(localStorage.getItem(key(category, mode)));
            return value && typeof value === "object" ? value : null;
        } catch {
            return null;
        }
    }

    function save(category, mode, session) {
        try { localStorage.setItem(key(category, mode), JSON.stringify(session)); } catch { /* Storage may be unavailable. */ }
    }

    function clear(category, mode) {
        try { localStorage.removeItem(key(category, mode)); } catch { /* Storage may be unavailable. */ }
    }

    modules.gameSession = { load, save, clear };
})(window);
