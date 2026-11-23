/* =========================================================================
 * Polandle – moduł rankingu (lokalny, per urządzenie)
 * Zbiera: najszybsze dzisiejsze odgadnięcie, łączną liczbę trafień,
 * serię dni z rzędu oraz historię (dla wyzwania mapowego).
 * Sam wstrzykuje przycisk „Ranking" i okno do strony.
 * =======================================================================*/

(function (root) {
    "use strict";

    const modules = root.PolandleModules = root.PolandleModules || {};
    const KEY = "polandle:ranking:v1";

    const startTimes = {};

    function loadAll() {
        try {
            const parsed = JSON.parse(localStorage.getItem(KEY));
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch {
            return {};
        }
    }

    function saveAll(all) {
        try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* Storage may be unavailable. */ }
    }

    function emptyCategory() {
        return {
            wins: 0,
            gaveUp: 0,
            bestTime: null,
            lastTime: null,
            dayStreak: 0,
            bestDayStreak: 0,
            lastPlayedDay: null,
            today: { day: null, fastest: null, count: 0 },
            history: []
        };
    }

    function getCategory(all, category) {
        return Object.assign(emptyCategory(), all[category] || {});
    }

    function dayKey(date) {
        return new Date(date).toISOString().slice(0, 10);
    }

    function daysBetween(fromKey, toKey) {
        if (!fromKey) return null;
        const from = new Date(fromKey + "T00:00:00Z");
        const to = new Date(toKey + "T00:00:00Z");
        return Math.round((to - from) / 86400000);
    }

    // Rozpoczęcie rundy – zapamiętanie czasu startu dla kategorii.
    function startRound(category) {
        startTimes[category] = Date.now();
    }

    function elapsedSeconds(category) {
        const start = startTimes[category];
        if (!start) return null;
        return Math.max(1, Math.round((Date.now() - start) / 1000));
    }

    function formatTime(seconds) {
        if (seconds === null || seconds === undefined) return "-";
        if (seconds < 60) return seconds + " s";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m + " min " + s + " s";
    }

    // Zapis wygranej (trafienia) – aktualizuje serię dni, czas i historię.
    function recordWin(category, options) {
        const opts = options || {};
        const all = loadAll();
        const cat = getCategory(all, category);
        const seconds = Number.isFinite(opts.seconds) ? opts.seconds : elapsedSeconds(category);
        const todayKey = dayKey(new Date());

        cat.wins += 1;
        if (Number.isFinite(seconds) && seconds > 0) {
            cat.lastTime = seconds;
            if (cat.bestTime === null || seconds < cat.bestTime) cat.bestTime = seconds;
        }

        // Reset „dzisiaj", gdy nowy dzień.
        if (cat.today.day !== todayKey) {
            cat.today = { day: todayKey, fastest: Number.isFinite(seconds) ? seconds : null, count: 0 };
        }
        cat.today.count += 1;
        if (Number.isFinite(seconds) && seconds > 0) {
            if (cat.today.fastest === null || seconds < cat.today.fastest) cat.today.fastest = seconds;
        }

        // Seria dni.
        const gap = daysBetween(cat.lastPlayedDay, todayKey);
        if (gap === 0) {
            // Ten sam dzień – seria bez zmian.
        } else if (gap === 1) {
            cat.dayStreak += 1;
        } else {
            cat.dayStreak = 1;
        }
        cat.lastPlayedDay = todayKey;
        if (cat.dayStreak > cat.bestDayStreak) cat.bestDayStreak = cat.dayStreak;

        cat.history = [{
            date: new Date().toISOString(),
            type: "win",
            time: Number.isFinite(seconds) ? seconds : null,
            tries: Number.isFinite(opts.tries) ? opts.tries : null
        }].concat(Array.isArray(cat.history) ? cat.history : []).slice(0, 30);

        all[category] = cat;
        saveAll(all);
        return cat;
    }

    function recordGiveUp(category) {
        const all = loadAll();
        const cat = getCategory(all, category);
        cat.gaveUp += 1;
        cat.history = [{
            date: new Date().toISOString(),
            type: "giveup",
            time: null,
            tries: null
        }].concat(Array.isArray(cat.history) ? cat.history : []).slice(0, 30);
        all[category] = cat;
        saveAll(all);
        return cat;
    }

    // Wyzwanie mapowe – zapis wyniku z liczbą trafień.
    function recordChallenge(score) {
        const all = loadAll();
        const cat = getCategory(all, "mapsChallenge");
        const value = Math.max(0, Number(score) || 0);
        const todayKey = dayKey(new Date());

        if (cat.today.day !== todayKey) {
            cat.today = { day: todayKey, fastest: null, count: 0 };
        }
        if (cat.bestTime === null || value > cat.bestTime) cat.bestTime = value;

        const gap = daysBetween(cat.lastPlayedDay, todayKey);
        if (gap === 1) cat.dayStreak += 1;
        else if (gap !== 0) cat.dayStreak = 1;
        cat.lastPlayedDay = todayKey;
        if (cat.dayStreak > cat.bestDayStreak) cat.bestDayStreak = cat.dayStreak;

        cat.history = [{
            date: new Date().toISOString(),
            type: "challenge",
            score: value
        }].concat(Array.isArray(cat.history) ? cat.history : []).slice(0, 30);

        all.mapsChallenge = cat;
        saveAll(all);
        return cat;
    }

    function getSummary(category) {
        return getCategory(loadAll(), category);
    }

    modules.ranking = {
        startRound,
        recordWin,
        recordGiveUp,
        recordChallenge,
        getSummary,
        formatTime
    };
})(window);