(function (root) {
    "use strict";

    const modules = root.PolandleModules = root.PolandleModules || {};
    const MODE_KEY = "polandle:game-mode:v1";

    function getMode() {
        return localStorage.getItem(MODE_KEY) === "practice" ? "practice" : "daily";
    }

    function setMode(mode) {
        const nextMode = mode === "practice" ? "practice" : "daily";
        localStorage.setItem(MODE_KEY, nextMode);
        return nextMode;
    }

    function bindModeSelect(select, onChange) {
        if (!select) return getMode();
        select._polandleModeChange = onChange;
        if (select.dataset.modeBound === "true") return select.value;
        select.value = getMode();
        select.addEventListener("change", () => {
            setMode(select.value);
            if (typeof select._polandleModeChange === "function") select._polandleModeChange();
        });
        select.dataset.modeBound = "true";
        return select.value;
    }

    function dayNumber() {
        const start = Date.UTC(2024, 0, 1);
        return Math.floor((Date.now() - start) / 86400000);
    }

    function dailyIndex(length, category) {
        let hash = dayNumber() + (category === "items" ? 7919 : 0);
        hash = (hash * 1103515245 + 12345) >>> 0;
        return length ? hash % length : 0;
    }

    function dayKey() {
        return new Date().toISOString().slice(0, 10);
    }

    function completionKey(category) {
        return `polandle:daily-complete:${category}:${dayKey()}`;
    }

    function isDailyCompleted(category) {
        return localStorage.getItem(completionKey(category)) === "true";
    }

    function markDailyCompleted(category) {
        localStorage.setItem(completionKey(category), "true");
    }

    function chooseTarget(list, category, mode = getMode()) {
        if (!Array.isArray(list) || list.length === 0) return null;
        if (mode === "practice") return list[Math.floor(Math.random() * list.length)];
        return list[dailyIndex(list.length, category)];
    }

    modules.gameMode = {
        bindModeSelect,
        chooseTarget,
        getMode,
        setMode,
        dayKey,
        isDailyCompleted,
        markDailyCompleted
    };
})(window);
