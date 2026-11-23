/* =========================================================================
 * Polandle – UI rankingu
 * Wstrzykuje na stronę przycisk „Ranking" oraz okno z podsumowaniem.
 * Użycie: rankingUI.mount({ category, title, challenge })
 * =======================================================================*/

(function (root) {
    "use strict";

    const modules = root.PolandleModules = root.PolandleModules || {};

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatTime(seconds) {
        if (seconds === null || seconds === undefined) return "-";
        if (seconds < 60) return seconds + " s";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m + " min " + s + " s";
    }

    function formatDate(iso) {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString("pl-PL") + " " + d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
        } catch {
            return "-";
        }
    }

    function renderChallenge(container, summary) {
        const best = summary.bestTime;
        const played = summary.history.filter(h => h.type === "challenge").length;
        container.innerHTML =
            '<div class="ranking-block">' +
                '<p class="ranking-label">Najlepszy wynik (trafienia w 60 s)</p>' +
                '<p class="ranking-big">' + (best ?? 0) + '</p>' +
            '</div>' +
            '<div class="ranking-grid">' +
                '<span class="ranking-cell">Rozegrane wyzwania: <b>' + played + '</b></span>' +
                '<span class="ranking-cell">Seria dni: <b>' + summary.dayStreak + '</b></span>' +
                '<span class="ranking-cell">Rekord serii: <b>' + summary.bestDayStreak + '</b></span>' +
            '</div>';

        const history = summary.history.filter(h => h.type === "challenge");
        const list = el("div", "ranking-history");
        if (history.length === 0) {
            list.innerHTML = '<p class="ranking-empty">Brak rozegranych wyzwań. Zagraj, aby zapisać wynik!</p>';
        } else {
            list.innerHTML = '<p class="ranking-label">Historia wyzwań</p>' + history.map((h, i) =>
                '<div class="ranking-row">' +
                    '<span class="ranking-row-main">#' + (history.length - i) + ' — <b>' + h.score + ' trafień</b></span>' +
                    '<span class="ranking-row-date">' + escapeHtml(formatDate(h.date)) + '</span>' +
                '</div>'
            ).join("");
        }
        container.appendChild(list);
    }

    function renderStandard(container, summary) {
        container.innerHTML =
            '<div class="ranking-block">' +
                '<p class="ranking-label">Dzisiaj — najszybsze odgadnięcie</p>' +
                '<p class="ranking-big">' + (summary.today.fastest !== null ? formatTime(summary.today.fastest) : "—") + '</p>' +
                '<p class="ranking-sub">Trafień dzisiaj: ' + summary.today.count + '</p>' +
            '</div>' +
            '<div class="ranking-grid">' +
                '<span class="ranking-cell">Łącznie trafień: <b>' + summary.wins + '</b></span>' +
                '<span class="ranking-cell">Najlepszy czas: <b>' + formatTime(summary.bestTime) + '</b></span>' +
                '<span class="ranking-cell">Seria dni: <b>' + summary.dayStreak + '</b></span>' +
                '<span class="ranking-cell">Rekord serii: <b>' + summary.bestDayStreak + '</b></span>' +
            '</div>';

        const wins = summary.history.filter(h => h.type === "win");
        const list = el("div", "ranking-history");
        if (wins.length === 0) {
            list.innerHTML = '<p class="ranking-empty">Brak zapisanych trafień. Rozegraj rundę, aby zobaczyć historię!</p>';
        } else {
            list.innerHTML = '<p class="ranking-label">Ostatnie trafienia</p>' + wins.slice(0, 15).map(h =>
                '<div class="ranking-row">' +
                    '<span class="ranking-row-main">Czas: <b>' + formatTime(h.time) + '</b>' + (h.tries ? ' • prób: ' + h.tries : '') + '</span>' +
                    '<span class="ranking-row-date">' + escapeHtml(formatDate(h.date)) + '</span>' +
                '</div>'
            ).join("");
        }
        container.appendChild(list);
    }
    function mount(config) {
        const ranking = modules.ranking;
        if (!ranking) return;
        if (document.getElementById("ranking-modal")) return;

        const category = config.category;
        const challenge = Boolean(config.challenge);

        const openBtn = el("button", config.icon ? "icon-button ranking-open-btn" : "ranking-open-btn");
        openBtn.type = "button";
        openBtn.id = "ranking-open-btn";
        openBtn.setAttribute("aria-label", "Otwórz ranking");

        if (config.icon) {
            openBtn.title = "Ranking";
            const img = document.createElement("img");
            img.src = "images/ranking.png";
            img.alt = "";
            img.setAttribute("aria-hidden", "true");
            openBtn.appendChild(img);
        } else {
            openBtn.textContent = "🏆 Ranking";
        }

        // Umieszczenie przycisku: obok wskazanego elementu (np. Księgi Wiedzy)
        // albo w pasku nawigacji.
        const anchor = config.nextTo ? document.querySelector(config.nextTo) : null;
        if (anchor && anchor.parentNode) {
            anchor.parentNode.insertBefore(openBtn, anchor.nextSibling);
        } else {
            const navMenu = document.querySelector(".nav-menu");
            if (navMenu) {
                navMenu.appendChild(document.createTextNode(" | "));
                navMenu.appendChild(openBtn);
            } else {
                const header = document.querySelector("header") || document.body;
                header.appendChild(openBtn);
            }
        }

        const overlay = el("div", "modal-overlay hidden");
        overlay.id = "ranking-modal";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "ranking-title");
        overlay.setAttribute("hidden", "true");

        const box = el("div", "modal-glass-box");
        const closeBtn = el("button", "close-btn", "×");
        closeBtn.type = "button";
        closeBtn.id = "ranking-close";
        closeBtn.setAttribute("aria-label", "Zamknij ranking");

        const title = el("h2", null, config.title || "Ranking");
        title.id = "ranking-title";
        const scroll = el("div", "modal-content-scroll ranking-content");
        scroll.id = "ranking-content";

        box.appendChild(closeBtn);
        box.appendChild(title);
        box.appendChild(scroll);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        function render() {
            const summary = ranking.getSummary(category);
            if (challenge) renderChallenge(scroll, summary);
            else renderStandard(scroll, summary);
        }

        function open() {
            render();
            overlay.classList.remove("hidden");
            overlay.removeAttribute("hidden");
            overlay.classList.add("active");
            closeBtn.focus();
        }
        function close() {
            overlay.classList.remove("active");
            overlay.classList.add("hidden");
            overlay.setAttribute("hidden", "true");
            openBtn.focus();
        }

        openBtn.addEventListener("click", open);
        closeBtn.addEventListener("click", close);
        overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && overlay.classList.contains("active")) close();
        });
    }

    modules.rankingUI = { mount };
})(window);