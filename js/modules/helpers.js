(function (root) {
    "use strict";

    const modules = root.PolandleModules = root.PolandleModules || {};

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function firstValue(item, keys, fallback = "-") {
        if (!item) return fallback;
        for (const key of keys) {
            if (item[key] !== undefined && item[key] !== null && item[key] !== "") {
                return item[key];
            }
        }
        return fallback;
    }

    function getItemName(item) { return firstValue(item, ["nazwa", "name"], "Nieznany"); }
    function getItemType(item) { return firstValue(item, ["typ", "type"]); }
    function getItemKind(item) { return firstValue(item, ["rodzaj", "kind"]); }
    function getItemMinLevel(item) { return firstValue(item, ["min_poziom", "min_level", "poziom", "lvl"]); }
    function getItemWeight(item) { return firstValue(item, ["waga", "weight", "rate"]); }
    function getItemAtk(item) { return firstValue(item, ["atk", "attack"]); }
    function getItemDef(item) { return firstValue(item, ["def", "defence", "defense"]); }
    function getItemLifesteal(item) { return firstValue(item, ["lifesteal", "lifeSteal", "ls"]); }
    function getItemBoosts(item) { return item ? (item.wzmacnia ?? item.boosts ?? null) : null; }
    function getItemWeaknesses(item) { return item ? (item.oslabia ?? item.osłabia ?? item.weaknesses ?? null) : null; }

    modules.helpers = {
        escapeHtml,
        firstValue,
        getItemName,
        getItemType,
        getItemKind,
        getItemMinLevel,
        getItemWeight,
        getItemAtk,
        getItemDef,
        getItemLifesteal,
        getItemBoosts,
        getItemWeaknesses
    };
})(window);
