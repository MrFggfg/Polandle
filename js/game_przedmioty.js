/* =========================================================================
 * Księga Przedmiotów – logika gry (Polandle style)
 * =======================================================================*/

(function () {
    "use strict";

    // ---------- Stan gry ----------
    const state = {
        target: null,
        gameOver: false,
        wrongGuesses: 0,
        guessed: [],           // nazwy przedmiotów już sprawdzonych
        suggestionFocus: -1,
    };

    // ---------- Skróty do DOM ----------
    const $ = (id) => document.getElementById(id);
    const guessInput      = $("guess-input");
    const guessesBody     = $("guesses-body");
    const suggestionsBox  = $("suggestions");
    const winMessage      = $("win-message");
    const correctName     = $("correct-item-name");
    const winStats        = $("win-stats");
    const restartButton   = $("restart-button");
    const switchPracticeButton = $("switch-practice-button");
    const modeSelect       = $("game-mode");
    const giveUpButton    = $("btn-giveup");
    const toastContainer  = $("toast-container");

    // ---------- Pomocnicze ----------
    const shared = window.PolandleModules;
    const escapeHtml = shared.helpers.escapeHtml;
    const getItemMinLevel = shared.helpers.getItemMinLevel;
    const getItemWeight = shared.helpers.getItemWeight;
    const getItemAtk = shared.helpers.getItemAtk;
    const getItemDef = shared.helpers.getItemDef;
    const getItemLifeSteal = shared.helpers.getItemLifesteal;
    const getItemName = shared.helpers.getItemName;
    const getItemType = shared.helpers.getItemType;
    const getItemKind = shared.helpers.getItemKind;
    const getItemBoosts = shared.helpers.getItemBoosts;
    const getItemWeaknesses = shared.helpers.getItemWeaknesses;
    const toast = shared.notifications.toast;
    const loadStats = () => shared.statistics.loadStats("items");
    const recordGame = result => shared.statistics.recordGame("items", result);

    function renderPlayerStats() {
        const stats = loadStats();
        $("stats-games").textContent = stats.games;
        $("stats-wins").textContent = stats.wins;
        $("stats-losses").textContent = stats.gaveUp;
        $("stats-best-tries").textContent = stats.bestTries ?? "-";
        $("stats-worst-tries").textContent = stats.worstTries ?? "-";
        $("stats-streak").textContent = stats.currentStreak;
        $("stats-best-streak").textContent = stats.bestStreak;
    }

    function configureEndActions(isDaily) {
        restartButton.classList.toggle("hidden", isDaily);
        switchPracticeButton.classList.toggle("hidden", !isDaily);
    }

    function showCompletedDaily() {
        state.gameOver = true;
        guessInput.disabled = true;
        giveUpButton.disabled = true;
        winMessage.querySelector("h2").textContent = "Dzisiejsza zagadka zakończona";
        correctName.parentElement.classList.add("hidden");
        winStats.textContent = "Wróć jutro albo przejdź do trybu treningowego.";
        configureEndActions(true);
        winMessage.classList.remove("hidden");
    }

    // =========================================================================
    // 1. Inicjalizacja gry
    // =========================================================================
    function initGame() {
        if (typeof przedmioty === "undefined" || !Array.isArray(przedmioty) || przedmioty.length === 0) {
            toast("Brak bazy przedmiotów!", "error");
            return;
        }

        state.gameOver = false;
        state.wrongGuesses = 0;
        state.guessed = [];
        state.suggestionFocus = -1;

        if (guessesBody) guessesBody.innerHTML = "";
        if (winMessage) {
            winMessage.classList.add("hidden");
            winMessage.classList.remove("giveup-mode");
            const winTitle = winMessage.querySelector("h2");
            if (winTitle) winTitle.textContent = "Gratulacje!";
            const guessedParagraph = correctName ? correctName.parentElement : null;
            if (guessedParagraph) guessedParagraph.classList.remove("hidden");
        }
        configureEndActions(false);
        renderPlayerStats();

        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
            guessInput.setAttribute("aria-expanded", "false");
            guessInput.setAttribute("aria-activedescendant", "");
        }
        if (giveUpButton) giveUpButton.disabled = false;
        if (suggestionsBox) suggestionsBox.innerHTML = "";

        shared.gameMode.bindModeSelect($("game-mode"), initGame);
        state.target = shared.gameMode.chooseTarget(przedmioty, "items");
        if (shared.gameMode.getMode() === "daily" && shared.gameMode.isDailyCompleted("items")) {
            showCompletedDaily();
            return;
        }

        if (guessInput) guessInput.focus();
    }

    // =========================================================================
    // 2. Autouzupełnianie (input)
    // =========================================================================
    if (guessInput) {
        guessInput.addEventListener("input", () => {
            const text = guessInput.value.toLowerCase().trim();
            suggestionsBox.innerHTML = "";
            state.suggestionFocus = -1;
            guessInput.setAttribute("aria-activedescendant", "");

            if (text.length < 1 || state.gameOver) {
                guessInput.setAttribute("aria-expanded", "false");
                return;
            }

            const matches = przedmioty.filter(p => {
                const name = p.nazwa || p.name || "";
                return name.toLowerCase().includes(text) && !state.guessed.includes(name);
            }).slice(0, 24);

            matches.forEach((item, index) => {
                const itemName = item.nazwa || item.name;
                const div = document.createElement("div");
                div.textContent = itemName;
                div.setAttribute("role", "option");
                div.id = "suggestion-" + index;
                div.addEventListener("click", () => selectSuggestion(itemName));
                suggestionsBox.appendChild(div);
            });

            guessInput.setAttribute("aria-expanded", matches.length > 0 ? "true" : "false");
        });

        guessInput.addEventListener("keydown", (e) => {
            const items = suggestionsBox.getElementsByTagName("div");

            if (e.key === "ArrowDown") {
                if (items.length === 0) return;
                e.preventDefault();
                state.suggestionFocus++;
                updateActiveSuggestion(items);
            } else if (e.key === "ArrowUp") {
                if (items.length === 0) return;
                e.preventDefault();
                state.suggestionFocus--;
                updateActiveSuggestion(items);
            } else if (e.key === "Enter") {
                if (items.length > 0 && state.suggestionFocus > -1) {
                    e.preventDefault();
                    selectSuggestion(items[state.suggestionFocus].textContent);
                } else {
                    submitGuess();
                }
            } else if (e.key === "Escape") {
                suggestionsBox.innerHTML = "";
                guessInput.setAttribute("aria-expanded", "false");
            }
        });
    }

    function updateActiveSuggestion(items) {
        if (!items || items.length === 0) return;
        for (let i = 0; i < items.length; i++) items[i].classList.remove("suggestion-active");

        if (state.suggestionFocus >= items.length) state.suggestionFocus = 0;
        if (state.suggestionFocus < 0) state.suggestionFocus = items.length - 1;

        const active = items[state.suggestionFocus];
        active.classList.add("suggestion-active");
        active.scrollIntoView({ block: "nearest" });
        guessInput.setAttribute("aria-activedescendant", active.id || "");
    }

    function selectSuggestion(name) {
        guessInput.value = name;
        suggestionsBox.innerHTML = "";
        state.suggestionFocus = -1;
        guessInput.setAttribute("aria-expanded", "false");
        submitGuess();
    }

    document.addEventListener("click", (e) => {
        if (guessInput && suggestionsBox && e.target !== guessInput && !suggestionsBox.contains(e.target)) {
            suggestionsBox.innerHTML = "";
            guessInput.setAttribute("aria-expanded", "false");
        }
    });

    // =========================================================================
    // 3. Zatwierdzanie strzału
    // =========================================================================
    function submitGuess() {
        if (state.gameOver) return;

        const guessName = guessInput.value.trim();
        if (!guessName) return;

        const guessed = przedmioty.find(p => {
            const name = p.nazwa || p.name || "";
            return name.toLowerCase() === guessName.toLowerCase();
        });

        if (!guessed) {
            toast("Nie ma takiego przedmiotu w bazie!", "error");
            return;
        }

        const guessedItemName = guessed.nazwa || guessed.name;
        if (state.guessed.includes(guessedItemName)) {
            toast(`Przedmiot „${guessedItemName}” został już sprawdzony.`, "info");
            guessInput.value = "";
            suggestionsBox.innerHTML = "";
            return;
        }

        state.guessed.push(guessedItemName);
        guessInput.value = "";
        suggestionsBox.innerHTML = "";
        guessInput.setAttribute("aria-expanded", "false");

        renderGuessRow(guessed);

        const targetName = state.target.nazwa || state.target.name;
        if (guessedItemName === targetName) {
            handleWin();
        } else {
            state.wrongGuesses++;
        }
    }

    // =========================================================================
    // 4. Renderowanie wiersza przedmiotu (10 kolumn)
    // =========================================================================
    function renderGuessRow(guessed) {
        const row = document.createElement("tr");
        const guessedName = guessed.nazwa || guessed.name;
        const targetName = state.target.nazwa || state.target.name;
        const isCorrect = guessedName === targetName;

        // 1. Nazwa
        row.appendChild(createCell(guessedName, isCorrect ? "correct" : "wrong"));
        // 2. Typ
        row.appendChild(createCell(guessed.typ || "-", guessed.typ === state.target.typ ? "correct" : "wrong"));
        // 3. Rodzaj
        row.appendChild(createCell(guessed.rodzaj || "-", guessed.rodzaj === state.target.rodzaj ? "correct" : "wrong"));
        
        // 4. Min. Poziom
        row.appendChild(createNumberCell(getItemMinLevel(guessed), getItemMinLevel(state.target)));

        // 5. Atak (ATK)
        row.appendChild(createNumberCell(getItemAtk(guessed), getItemAtk(state.target)));
        // 6. Obrona (DEF)
        row.appendChild(createNumberCell(getItemDef(guessed), getItemDef(state.target)));

        // 7. Waga
        row.appendChild(createNumberCell(getItemWeight(guessed), getItemWeight(state.target)));

        // 8. Lifesteal
        const guessedLS = getItemLifeSteal(guessed);
        const targetLS = getItemLifeSteal(state.target);
        const lsMatch = String(guessedLS ?? "").trim().toLowerCase() === String(targetLS ?? "").trim().toLowerCase();
        row.appendChild(createCell(guessedLS ?? "-", lsMatch ? "correct" : "wrong"));

        // 9. Wzmacnia
        row.appendChild(createArrayMatchCell(getItemBoosts(guessed), getItemBoosts(state.target)));
        // 10. Osłabia
        row.appendChild(createArrayMatchCell(getItemWeaknesses(guessed), getItemWeaknesses(state.target)));

        Array.from(row.children).forEach((cell, index) => {
            cell.style.animationDelay = `${index * 0.15}s`;
        });

        if (guessesBody) guessesBody.insertBefore(row, guessesBody.firstChild);
    }

    function createCell(text, status) {
        const td = document.createElement("td");
        td.textContent = text ?? "-";
        td.className = `cell cell-${status}`;
        return td;
    }

    function createNumberCell(guessedVal, targetVal) {
        const td = document.createElement("td");
        td.className = "cell";

        const g = (guessedVal !== undefined && guessedVal !== null && guessedVal !== '') ? Number(guessedVal) : 0;
        const t = (targetVal !== undefined && targetVal !== null && targetVal !== '') ? Number(targetVal) : 0;

        if (isNaN(g) || isNaN(t)) {
            td.textContent = guessedVal ?? "-";
            td.classList.add(guessedVal === targetVal ? "cell-correct" : "cell-wrong");
            return td;
        }

        if (g === t) {
            td.textContent = g;
            td.classList.add("cell-correct");
        } else {
            const arrow = g < t ? " ↑" : " ↓";
            td.textContent = g + arrow;
            const diff = Math.abs(g - t);
            const margin = Math.abs(t) * 0.20;
            
            if (diff <= margin && t !== 0) {
                td.classList.add("cell-close");
            } else {
                td.classList.add("cell-wrong");
            }
        }
        return td;
    }

    function normalizeElementValue(value) {
        if (value === undefined || value === null || value === "") return "";
        return String(value).trim().toLowerCase();
    }

    function mapElementToBadge(value) {
        const normalized = normalizeElementValue(value);
        if (!normalized) return { css: "default", label: "-" };

        const map = {
            fire: { css: "fire", label: "Ogień" },
            ogień: { css: "fire", label: "Ogień" },
            ogien: { css: "fire", label: "Ogień" },
            water: { css: "water", label: "Woda" },
            woda: { css: "water", label: "Woda" },
            earth: { css: "earth", label: "Ziemia" },
            ziemia: { css: "earth", label: "Ziemia" },
            wind: { css: "wind", label: "Wiatr" },
            wiatr: { css: "wind", label: "Wiatr" },
            light: { css: "light", label: "Światło" },
            światło: { css: "light", label: "Światło" },
            swiatlo: { css: "light", label: "Światło" },
            dark: { css: "dark", label: "Mrok" },
            mrok: { css: "dark", label: "Mrok" },
            shadow: { css: "shadow", label: "Cień" },
            cień: { css: "shadow", label: "Cień" },
            cien: { css: "shadow", label: "Cień" },
            ice: { css: "ice", label: "Lód" },
            lód: { css: "ice", label: "Lód" },
            lod: { css: "ice", label: "Lód" },
            nature: { css: "nature", label: "Natura" },
            natura: { css: "nature", label: "Natura" },
            magic: { css: "magic", label: "Magia" },
            magia: { css: "magic", label: "Magia" },
            poison: { css: "poison", label: "Trucizna" },
            trucizna: { css: "poison", label: "Trucizna" },
            physical: { css: "physical", label: "Fizyczne" },
            fizyczne: { css: "physical", label: "Fizyczne" },
            energy: { css: "energy", label: "Energia" },
            energia: { css: "energy", label: "Energia" },
            lightning: { css: "lightning", label: "Błyskawica" },
            błyskawica: { css: "lightning", label: "Błyskawica" },
            blyskawica: { css: "lightning", label: "Błyskawica" }
        };

        const known = map[normalized];
        if (known) return known;

        const fallback = normalized
            .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
            .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
            .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
            .replace(/\s+/g, '-');

        return { css: fallback || 'default', label: value };
    }

    function createArrayMatchCell(guessedVal, targetVal) {
        const td = document.createElement("td");
        td.className = "cell";

        const gArr = Array.isArray(guessedVal) ? guessedVal : (guessedVal ? [guessedVal] : []);
        const tArr = Array.isArray(targetVal) ? targetVal : (targetVal ? [targetVal] : []);

        const cleanG = gArr.map(item => normalizeElementValue(item));
        const cleanT = tArr.map(item => normalizeElementValue(item));
        const hasMatch = cleanG.some(item => item && cleanT.includes(item));

        if (gArr.length === 0 && tArr.length === 0) {
            td.textContent = "-";
            td.classList.add("cell-wrong");
            return td;
        }

        const html = gArr.map(item => {
            const normalized = normalizeElementValue(item);
            if (!normalized) return "<span class=\"badge type-default\">-</span>";
            const badge = mapElementToBadge(item);
            return `<span class="badge type-${badge.css}">${escapeHtml(badge.label)}</span>`;
        }).join(" ");

        td.innerHTML = html || "-";
        td.classList.add(hasMatch ? "cell-correct" : "cell-wrong");

        return td;
    }

    // =========================================================================
    // 5. Wygrana + statystyki
    // =========================================================================
    function handleWin() {
        state.gameOver = true;
        if (guessInput) guessInput.disabled = true;

        if (winMessage) {
            winMessage.classList.remove("giveup-mode");
            const winTitle = winMessage.querySelector("h2");
            if (winTitle) winTitle.textContent = "Gratulacje!";
            const guessedParagraph = correctName ? correctName.parentElement : null;
            if (guessedParagraph) guessedParagraph.style.display = "";
        }
        
        const targetName = state.target.nazwa || state.target.name;
        if (correctName) correctName.textContent = targetName;

        const tries = state.guessed.length;
        const stats = recordGame({ won: true, tries });
        if (shared.gameMode.getMode() === "daily") shared.gameMode.markDailyCompleted("items");

        if (winStats) {
            winStats.textContent =
                `Prób: ${tries} • Najlepszy wynik: ${stats.bestTries} • Najgorszy wynik: ${stats.worstTries} • ` +
                `Wygrane: ${stats.wins}/${stats.games}`;
        }

        configureEndActions(shared.gameMode.getMode() === "daily");
        renderPlayerStats();

        if (winMessage) winMessage.classList.remove("hidden");
    }

    // =========================================================================
    // 6. Poddaj się + statystyki
    // =========================================================================
    if (giveUpButton) {
        giveUpButton.addEventListener("click", () => {
            if (state.gameOver || !state.target) return;
            state.gameOver = true;
            if (guessInput) guessInput.disabled = true;
            if (suggestionsBox) suggestionsBox.innerHTML = "";

            const stats = recordGame({ won: false });

            const targetName = state.target.nazwa || state.target.name;

            if (shared.gameMode.getMode() === "daily") {
                shared.gameMode.markDailyCompleted("items");
                correctName.parentElement.classList.add("hidden");
                winMessage.querySelector("h2").textContent = "Dzisiejsza zagadka zakończona";
                winStats.textContent = "Poddano zagadkę. Wróć jutro albo przejdź do trybu treningowego.";
                configureEndActions(true);
                renderPlayerStats();
                winMessage.classList.remove("hidden");
                return;
            }

            if (winMessage) {
                winMessage.classList.add("giveup-mode");
                const winTitle = winMessage.querySelector("h2");
                if (winTitle) winTitle.textContent = "Poddajesz się!";
                
                const guessedParagraph = correctName ? correctName.parentElement : null;
                if (guessedParagraph) guessedParagraph.style.display = "none";
            }

            if (winStats) {
                winStats.innerHTML = `Poszukiwanym przedmiotem był: <b>${escapeHtml(targetName)}</b><br>` +
                    `<span style="font-size: 0.9em; opacity: 0.8; margin-top: 6px; display: inline-block;">Gry: ${stats.games} • Poddane: ${stats.gaveUp}</span>`;
            }

            if (winMessage) winMessage.classList.remove("hidden");
        });
    }

    // =========================================================================
    // 7. Restart
    // =========================================================================
    if (restartButton) {
        restartButton.addEventListener("click", () => {
            if (shared.gameMode.getMode() === "practice") initGame();
        });
    }
    if (switchPracticeButton) {
        switchPracticeButton.addEventListener("click", () => {
            shared.gameMode.setMode("practice");
            modeSelect.value = "practice";
            initGame();
        });
    }

    function renderItemKnowledge() {
        if (!Array.isArray(przedmioty)) return;
        renderPlayerStats();

        const counts = (values) => values.reduce((result, value) => {
            const key = String(value || "Brak");
            result[key] = (result[key] || 0) + 1;
            return result;
        }, {});

        const effects = (key) => przedmioty.flatMap(item => {
            const value = key === "boosts" ? getItemBoosts(item) : getItemWeaknesses(item);
            return Array.isArray(value) ? value : (value ? [value] : []);
        });

        const renderCounts = (id, values) => {
            const element = $(id);
            if (!element) return;
            element.innerHTML = Object.entries(counts(values))
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => `<span class="stat-item">${escapeHtml(name)}<span class="stat-number">${count}</span></span>`)
                .join("") || '<span class="stats-empty">Brak danych</span>';
        };

        renderCounts("stats-types", przedmioty.map(item => `${getItemType(item)} / ${getItemKind(item)}`));
        renderCounts("stats-wzmacnia", effects("boosts"));
        renderCounts("stats-oslabia", effects("weaknesses"));
    }

    shared.modal.bindModal({
        modal: $("stats-modal"),
        openButton: $("open-stats"),
        closeButton: $("close-stats"),
        render: renderItemKnowledge
    });

    // Start automatyczny
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initGame);
    } else {
        initGame();
    }
})();