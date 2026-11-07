(function (root) {
    "use strict";

    const modules = root.PolandleModules = root.PolandleModules || {};
    const KEY = "polandle:stats:v2";

    function emptyStats() {
        return {
            games: 0,
            wins: 0,
            gaveUp: 0,
            bestTries: null,
            worstTries: null,
            currentStreak: 0,
            bestStreak: 0,
            lastPlayed: null,
            history: []
        };
    }

    function loadAll() {
        try {
            const parsed = JSON.parse(localStorage.getItem(KEY));
            return parsed && typeof parsed === "object" ? parsed : { monsters: emptyStats(), items: emptyStats() };
        } catch {
            return { monsters: emptyStats(), items: emptyStats() };
        }
    }

    function loadStats(category) {
        const all = loadAll();
        const stats = { ...emptyStats(), ...(all[category] || {}) };
        if (stats.worstTries === null && stats.bestTries !== null) {
            stats.worstTries = stats.bestTries;
        }
        return stats;
    }

    function saveAll(all) {
        try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* Storage may be unavailable. */ }
    }

    function recordGame(category, result) {
        const all = loadAll();
        const stats = { ...emptyStats(), ...(all[category] || {}) };
        const won = Boolean(result.won);
        const tries = Number(result.tries);
        const now = new Date().toISOString();

        stats.games += 1;
        stats.lastPlayed = now;
        if (won) {
            stats.wins += 1;
            stats.currentStreak += 1;
            stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
            if (Number.isFinite(tries) && (stats.bestTries === null || tries < stats.bestTries)) {
                stats.bestTries = tries;
            }
            if (Number.isFinite(tries) && (stats.worstTries === null || tries > stats.worstTries)) {
                stats.worstTries = tries;
            }
        } else {
            stats.gaveUp += 1;
            stats.currentStreak = 0;
        }
        stats.history = [{ date: now, won, tries: Number.isFinite(tries) ? tries : null }]
            .concat(Array.isArray(stats.history) ? stats.history : [])
            .slice(0, 30);

        all[category] = stats;
        saveAll(all);
        return stats;
    }

    modules.statistics = { emptyStats, loadStats, recordGame };
})(window);
