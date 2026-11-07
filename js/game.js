/* =========================================================================
 * Polandle – logika gry[cite: 1].
 * Poprawki względem oryginału[cite: 1]:
 *  - IIFE + "use strict" (bez globalnych zmiennych wyciekających do window)[cite: 1]
 *  - Usunięty console.log ujawniający wylosowanego potwora[cite: 1]
 *  - alert() zastąpione powiadomieniami (toastami)[cite: 1]
 *  - Escape HTML w dynamicznie wstawianej treści (ochrona przed XSS)[cite: 1]
 *  - Duplikaty kodu i listenerów usunięte[cite: 1]
 *  - Obsługa klawisza Esc i klawiatury dla modala Księgi Wiedzy[cite: 1]
 *  - Statystyki gracza w localStorage[cite: 1]
 *  - aria-* atrybuty aktualizowane przy podpowiedziach[cite: 1]
 *  - Wyświetlanie statystyk rozegranych gier przy wygranej i przegranej[cite: 1]
 * =======================================================================*/

(function () {
    "use strict";

    // ---------- Stan gry[cite: 1] ----------
    const state = {
        target: null,
        gameOver: false,
        wrongGuesses: 0,
        guessed: [],           // nazwy potworów już sprawdzonych[cite: 1]
        suggestionFocus: -1,
    };

    // ---------- Skróty do DOM[cite: 1] ----------
    const $ = (id) => document.getElementById(id);
    const guessInput      = $("guess-input");
    const guessesBody     = $("guesses-body");
    const suggestionsBox  = $("suggestions");
    const winMessage      = $("win-message");
    const correctName     = $("correct-monster-name");
    const winStats        = $("win-stats");
    const restartButton   = $("restart-button");
    const switchPracticeButton = $("switch-practice-button");
    const modeSelect       = $("game-mode");
    const hintBox         = $("hint-message");
    const toastContainer  = $("toast-container");

    // ---------- Pomocnicze[cite: 1] ----------
    const shared = window.PolandleModules;
    const escapeHtml = shared.helpers.escapeHtml;
    const toast = shared.notifications.toast;
    const loadStats = () => shared.statistics.loadStats("monsters");
    const recordGame = result => shared.statistics.recordGame("monsters", result);
    const chooseTarget = shared.gameMode.chooseTarget;

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
        $("btn-giveup").disabled = true;
        lockHint("btn-hint1", "Dzisiejsza zagadka została już rozegrana");
        lockHint("btn-hint2", "Dzisiejsza zagadka została już rozegrana");
        winMessage.querySelector("h2").textContent = "Dzisiejsza zagadka zakończona";
        correctName.parentElement.classList.add("hidden");
        winStats.textContent = "Wróć jutro albo przejdź do trybu treningowego.";
        configureEndActions(true);
        winMessage.classList.remove("hidden");
    }

    // Pomocnicza funkcja generująca tekst statystyk rozegranych gier[cite: 1]
    function getPlayerStatsText(stats, tries = null) {
        let text = `Rozegrane: ${stats.games} • Wygrane: ${stats.wins} • Przegrane: ${stats.gaveUp}`;
        if (tries !== null) {
            text = `Prób: ${tries} • Najlepszy wynik: ${stats.bestTries ?? '-'} • Najgorszy wynik: ${stats.worstTries ?? '-'} • ` + text;
        }
        return text;
    }

    // =========================================================================
    // 1. Inicjalizacja gry[cite: 1]
    // =========================================================================
    function initGame() {
        if (typeof monsters === "undefined" || !Array.isArray(monsters) || monsters.length === 0) {
            toast("Brak bazy potworów!", "error");
            return;
        }

        state.gameOver = false;
        state.wrongGuesses = 0;
        state.guessed = [];
        state.suggestionFocus = -1;

        guessesBody.innerHTML = "";
        winMessage.classList.add("hidden");
        winMessage.querySelector("h2").textContent = "Gratulacje!";
        correctName.parentElement.classList.remove("hidden");
        configureEndActions(false);
        guessInput.value = "";
        guessInput.disabled = false;
        $("btn-giveup").disabled = false;
        guessInput.setAttribute("aria-expanded", "false");
        guessInput.setAttribute("aria-activedescendant", "");
        suggestionsBox.innerHTML = "";

        lockHint("btn-hint1", "Dostępne po 3 błędach");
        lockHint("btn-hint2", "Dostępne po 6 błędach");

        hintBox.classList.add("hidden");
        hintBox.innerHTML = "";

        shared.gameMode.bindModeSelect($("game-mode"), initGame);
        renderPlayerStats();
        state.target = chooseTarget(monsters, "monsters");
        if (shared.gameMode.getMode() === "daily" && shared.gameMode.isDailyCompleted("monsters")) {
            showCompletedDaily();
            return;
        }
        // (nie logujemy nazwy potwora — cheat-mode wycięty)[cite: 1]

        guessInput.focus();
    }

    function lockHint(id, title) {
        const btn = $(id);
        if (!btn) return;
        btn.classList.add("locked");
        btn.disabled = true;
        btn.title = title;
        btn.setAttribute("aria-label", (btn.getAttribute("aria-label") || "").replace(/–.*$/, "– " + title));
    }
    function unlockHint(id, title) {
        const btn = $(id);
        if (!btn) return;
        btn.classList.remove("locked");
        btn.disabled = false;
        btn.title = title;
    }

    // =========================================================================
    // 2. Autouzupełnianie (input)[cite: 1]
    // =========================================================================
    guessInput.addEventListener("input", () => {
        const text = guessInput.value.toLowerCase().trim();
        suggestionsBox.innerHTML = "";
        state.suggestionFocus = -1;
        guessInput.setAttribute("aria-activedescendant", "");

        if (text.length < 1 || state.gameOver) {
            guessInput.setAttribute("aria-expanded", "false");
            return;
        }

        const matches = monsters.filter(m =>
            m.name.toLowerCase().includes(text) &&
            !state.guessed.includes(m.name)
        ).slice(0, 24);

        matches.forEach((monster, index) => {
            const div = document.createElement("div");
            div.textContent = monster.name;
            div.setAttribute("role", "option");
            div.id = "suggestion-" + index;
            div.addEventListener("click", () => selectSuggestion(monster.name));
            suggestionsBox.appendChild(div);
        });

        guessInput.setAttribute("aria-expanded", matches.length > 0 ? "true" : "false");
    });

    // Klawiatura na inpucie[cite: 1]
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

    // Zamykaj listę po kliknięciu poza nią[cite: 1]
    document.addEventListener("click", (e) => {
        if (e.target !== guessInput && !suggestionsBox.contains(e.target)) {
            suggestionsBox.innerHTML = "";
            guessInput.setAttribute("aria-expanded", "false");
        }
    });

    // =========================================================================
    // 3. Zatwierdzanie strzału[cite: 1]
    // =========================================================================
    function submitGuess() {
        if (state.gameOver) return;

        const guessName = guessInput.value.trim();
        if (!guessName) return;

        const guessed = monsters.find(m => m.name.toLowerCase() === guessName.toLowerCase());

        if (!guessed) {
            toast("Nie ma takiego potwora w bazie!", "error");
            return;
        }
        if (state.guessed.includes(guessed.name)) {
            toast(`Potwór „${guessed.name}” został już sprawdzony.`, "info");
            guessInput.value = "";
            suggestionsBox.innerHTML = "";
            return;
        }

        state.guessed.push(guessed.name);
        guessInput.value = "";
        suggestionsBox.innerHTML = "";
        guessInput.setAttribute("aria-expanded", "false");

        renderGuessRow(guessed);

        if (guessed.name === state.target.name) {
            handleWin();
        } else {
            state.wrongGuesses++;
            if (state.wrongGuesses >= 3) unlockHint("btn-hint1", "Kliknij, aby zobaczyć podpowiedź");
            if (state.wrongGuesses >= 6) unlockHint("btn-hint2", "Druga podpowiedź");
        }
    }

    // =========================================================================
    // 4. Sprite'y[cite: 1]
    // =========================================================================
    const spriteConfigs = {
        "animal.png": 8, "albino_elf.png": 5, "amazon.png": 8, "angel.png": 6,
        "beholder.png": 3, "chaos.png": 7, "chess.png": 12, "dark_elf.png": 8,
        "demon.png": 7, "dragon.png": 8, "dwarf.png": 8, "dwarf_deep.png": 7,
        "dwarf_duergar.png": 8, "elemental.png": 8, "elf.png": 8, "enormous_creature.png": 1,
        "ent.png": 4, "fairy.png": 3, "farm_animal.png": 12, "fowl.png": 6,
        "frogman.png": 3, "gargoyle.png": 4, "giant_animal.png": 3, "giant_human.png": 10,
        "gnome.png": 6, "goat.png": 1, "goblin.png": 3, "golem.png": 4,
        "huge_animal.png": 8, "human.png": 5, "human_armored.png": 8, "human_barbarian.png": 7,
        "human_cannibal.png": 4, "human_evil.png": 10, "human_imperial.png": 8,
        "human_kalavan.png": 5, "human_little.png": 2, "human_risecia.png": 4,
        "human_soldier.png": 9, "hybrid.png": 8, "insect.png": 5, "kobold.png": 6,
        "madaram.png": 8, "minotaur.png": 2, "mountain_dwarf.png": 5, "mountain_orc.png": 4,
        "mummy.png": 2, "mutant.png": 7, "mythical_being.png": 8, "naga.png": 4,
        "northpole_elf.png": 10, "ogre.png": 4, "oni.png": 5, "orc.png": 5,
        "pol_chocholy.png": 3, "pol_czarty.png": 5, "pol_elfy_gorskie.png": 8,
        "pol_kamienne.png": 2, "pol_kamienne_wielkie.png": 3, "pol_krzewy.png": 3,
        "pol_magowie.png": 8, "pol_malze.png": 2, "pol_mutanty.png": 7,
        "pol_mutanty_wielkie.png": 4, "pol_niesmietelne.png": 4, "pol_ogniki.png": 3,
        "pol_olbrzymy.png": 4, "pol_owady.png": 4, "pol_pasterze.png": 3,
        "pol_piraci.png": 7, "pol_piraci_lutin.png": 8, "pol_piraci_truskul.png": 8,
        "pol_pokutniki.png": 7, "pol_ptaki.png": 4, "pol_ptaki_wielkie.png": 1,
        "pol_rycerze.png": 9, "pol_serafiny.png": 4, "pol_skrzaty_lesne.png": 9,
        "pol_smoki.png": 8, "pol_sniegowe.png": 3, "pol_szaraki.png": 8,
        "pol_wiesniacy.png": 3, "pol_wilkolaki.png": 8, "pol_zbojnicy_gorscy.png": 6,
        "pol_zbojnicy_lesni.png": 8, "pol_zjawy.png": 8, "pol_zjawy_wielkie.png": 6,
        "pol_zwierzeta.png": 8, "pol_zwierzeta_male.png": 3, "ratfolk.png": 3,
        "reptile.png": 7, "rodent.png": 8, "sheep.png": 1, "sheepman.png": 4,
        "slime.png": 4, "spider.png": 3, "troll.png": 4, "undead.png": 14,
        "undead_fallen.png": 9, "undead_skeleton.png": 6, "undead_specter.png": 6,
        "undead_zombie.png": 5, "vampire.png": 7,
    };

    function getSpriteStyle(tileid) {
        if (!tileid) return { backgroundColor: "transparent" };
        const [fileName, idStr] = tileid.split(":");
        const id = parseInt(idStr, 10);
        const cols = spriteConfigs[fileName] || 8;
        const size = 32;
        const col = id % cols;
        const row = Math.floor(id / cols);
        return {
            backgroundImage: `url('images/${fileName}')`,
            backgroundSize: `${cols * size}px auto`,
            backgroundPosition: `-${col * size}px -${row * size}px`,
            width: `${size}px`,
            height: `${size}px`,
        };
    }

    // =========================================================================
    // 5. Renderowanie wiersza[cite: 1]
    // =========================================================================
    function renderGuessRow(guessed) {
        const row = document.createElement("tr");
        const isCorrect = guessed.name === state.target.name;

        // Ikona[cite: 1]
        const iconCell = document.createElement("td");
        iconCell.className = "cell " + (isCorrect ? "cell-correct" : "cell-wrong");
        const spriteDiv = document.createElement("div");
        spriteDiv.className = "monster-sprite";
        Object.assign(spriteDiv.style, getSpriteStyle(guessed.tileid));
        iconCell.appendChild(spriteDiv);
        row.appendChild(iconCell);

        // Kolejne komórki[cite: 1]
        row.appendChild(createCell(guessed.name,           guessed.name       === state.target.name       ? "correct" : "wrong"));
        row.appendChild(createCell(guessed.class || "Brak", guessed.class      === state.target.class      ? "correct" : "wrong"));
        row.appendChild(createNumberCell(guessed.level,   state.target.level));
        row.appendChild(createNumberCell(guessed.attack,  state.target.attack));
        row.appendChild(createNumberCell(guessed.defense, state.target.defense));
        row.appendChild(createNumberCell(guessed.hp,      state.target.hp));
        row.appendChild(createSizeCell(guessed.size,      state.target.size));
        row.appendChild(createCell(guessed.rareDrop,      guessed.rareDrop   === state.target.rareDrop    ? "correct" : "wrong"));
        row.appendChild(createCell(guessed.attackType,    guessed.attackType === state.target.attackType  ? "correct" : "wrong"));
        row.appendChild(createCell(guessed.defenseType,   guessed.defenseType === state.target.defenseType ? "correct" : "wrong"));

        Array.from(row.children).forEach((cell, index) => {
            cell.style.animationDelay = `${index * 0.15}s`;
        });

        guessesBody.insertBefore(row, guessesBody.firstChild);
    }

    function createCell(text, status) {
        const td = document.createElement("td");
        td.textContent = text ?? "";
        td.className = `cell cell-${status}`;
        return td;
    }

    function createNumberCell(guessedVal, targetVal) {
        const td = document.createElement("td");
        td.className = "cell";

        if (guessedVal === targetVal) {
            td.textContent = guessedVal;
            td.classList.add("cell-correct");
        } else {
            const arrow = guessedVal < targetVal ? " ↑" : " ↓";
            td.textContent = guessedVal + arrow;
            const diff = Math.abs(guessedVal - targetVal);
            const margin = Math.abs(targetVal) * 0.20;
            if (diff <= margin && targetVal !== 0) td.classList.add("cell-close");
            else td.classList.add("cell-wrong");
        }
        return td;
    }

    function createSizeCell(guessedSize, targetSize) {
        const td = document.createElement("td");
        td.className = "cell";
        if (guessedSize === targetSize) {
            td.textContent = guessedSize;
            td.classList.add("cell-correct");
        } else {
            const g = parseInt((guessedSize || "1").split(",")[0], 10) || 1;
            const t = parseInt((targetSize  || "1").split(",")[0], 10) || 1;
            const arrow = g < t ? " ↑" : " ↓";
            td.textContent = guessedSize + arrow;
            td.classList.add("cell-wrong");
        }
        return td;
    }

    // =========================================================================
    // 6. Wygrana + statystyki gracza[cite: 1]
    // =========================================================================
    function handleWin() {
        state.gameOver = true;
        guessInput.disabled = true;
        correctName.textContent = state.target.name;

        const tries = state.guessed.length;
        const stats = recordGame({ won: true, tries });
        if (shared.gameMode.getMode() === "daily") shared.gameMode.markDailyCompleted("monsters");

        // Wyświetlanie statystyk rozegranych gier przy wygranej[cite: 1]
        winStats.textContent = getPlayerStatsText(stats, tries);
        correctName.parentElement.classList.remove("hidden");
        configureEndActions(shared.gameMode.getMode() === "daily");
        renderPlayerStats();
        winMessage.classList.remove("hidden");
    }

    // =========================================================================
    // 7. Restart + przyciski[cite: 1]
    // =========================================================================
    restartButton.addEventListener("click", () => {
        if (shared.gameMode.getMode() === "practice") initGame();
    });
    switchPracticeButton.addEventListener("click", () => {
        shared.gameMode.setMode("practice");
        modeSelect.value = "practice";
        initGame();
    });

    // Podpowiedź 1[cite: 1]
    $("btn-hint1").addEventListener("click", () => {
        const btn = $("btn-hint1");
        if (btn.disabled || !state.target) return;
        const respawn = formatRespawn(state.target.respawn);
        btn.title = `Klasa: ${state.target.class}, Exp: ${state.target.experience}, Respawn: ${respawn}`;

        hintBox.innerHTML = `
            💡 <b>Podpowiedź 1:</b><br>
            • Klasa potwora: <span class="hint-value">${escapeHtml(state.target.class || "Brak")}</span><br>
            • Doświadczenie (EXP): <span class="hint-value">${escapeHtml(state.target.experience || "0")}</span><br>
            • Czas odrodzenia: <span class="hint-value">${escapeHtml(respawn)}</span>
        `;
        hintBox.classList.remove("hidden");
    });

    // Podpowiedź 2[cite: 1]
    $("btn-hint2").addEventListener("click", () => {
        const btn = $("btn-hint2");
        if (btn.disabled || !state.target) return;
        btn.title = "Starkad!";
        hintBox.innerHTML = `
            <b>Starkad głosi:</b><br>
            <span class="hint-value hint-italic">"${escapeHtml(state.target.podpowiedz || "Brak dedykowanej podpowiedzi dla tego potwora.")}"</span>
        `;
        hintBox.classList.remove("hidden");
    });

    // Poddaj się (Przegrana)[cite: 1]
    $("btn-giveup").addEventListener("click", () => {
        if (state.gameOver || !state.target) return;
        state.gameOver = true;
        guessInput.disabled = true;
        suggestionsBox.innerHTML = "";

        const stats = recordGame({ won: false });
        if (shared.gameMode.getMode() === "daily") {
            shared.gameMode.markDailyCompleted("monsters");
            correctName.parentElement.classList.add("hidden");
            winMessage.querySelector("h2").textContent = "Dzisiejsza zagadka zakończona";
            winStats.textContent = "Poddano zagadkę. Wróć jutro albo przejdź do trybu treningowego.";
            configureEndActions(true);
            renderPlayerStats();
            winMessage.classList.remove("hidden");
            hintBox.classList.add("hidden");
            return;
        }

        // Wyświetlanie statystyk rozegranych gier przy przegranej/poddaniu[cite: 1]
        hintBox.innerHTML = `
            <p class="giveup-title">Poddajesz się!</p>
            <p>Poszukiwanym potworem był: <b>${escapeHtml(state.target.name)}</b></p>
            <p style="margin: 8px 0; font-weight: 500;">${escapeHtml(getPlayerStatsText(stats))}</p>
            <button type="button" id="giveup-restart-btn" class="giveup-btn">Spróbuj ponownie</button>
        `;
        hintBox.classList.remove("hidden");
        $("giveup-restart-btn").addEventListener("click", initGame);
    });

    // =========================================================================
    // 8. Modal Księgi Wiedzy (dostępny z klawiatury)[cite: 1]
    // =========================================================================
    shared.modal.bindModal({
        modal: $("stats-modal"),
        openButton: $("btn-stats"),
        closeButton: $("close-stats"),
        render: renderKsiegaWiedzy
    });

    function renderKsiegaWiedzy() {
        if (typeof monsters === "undefined" || !Array.isArray(monsters)) return;
        renderPlayerStats();

        const classCounts = {};
        const attackTypes = new Set();
        const defenseTypes = new Set();

        monsters.forEach(m => {
            const cls = m.class || "Brak";
            classCounts[cls] = (classCounts[cls] || 0) + 1;
            if (m.attackType  && m.attackType  !== "Brak" && m.attackType  !== "-") attackTypes.add(m.attackType);
            if (m.defenseType && m.defenseType !== "Brak" && m.defenseType !== "-") defenseTypes.add(m.defenseType);
        });

        const sortedClasses = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);
        $("stats-classes").innerHTML = sortedClasses.map(([cls, count]) => `
            <span class="stat-item">${escapeHtml(cls)}<span class="stat-number">${count}</span></span>
        `).join("");

        $("stats-attacks").innerHTML = Array.from(attackTypes).sort().map(type => {
            const cssClass = escapeHtml(type.toLowerCase());
            return `<span class="badge type-${cssClass}"> ${escapeHtml(type)}</span>`;
        }).join("") || '<span class="stats-empty">Brak danych</span>';

        $("stats-defenses").innerHTML = Array.from(defenseTypes).sort().map(type => {
            const cssClass = escapeHtml(type.toLowerCase());
            return `<span class="badge type-${cssClass}"> ${escapeHtml(type)}</span>`;
        }).join("") || '<span class="stats-empty">Brak danych</span>';
    }

    // Format czasu respawnu[cite: 1]
    function formatRespawn(rawVal) {
        if (rawVal === undefined || rawVal === null || isNaN(rawVal)) return "-";
        const totalMinutes = rawVal / 200;
        if (totalMinutes < 1) return `${Math.round(totalMinutes * 60)} s`;
        if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const rest = Math.round(totalMinutes % 60);
            return rest > 0 ? `${hours}h ${rest}min` : `${hours}h`;
        }
        const formatted = Number.isInteger(totalMinutes) ? totalMinutes : totalMinutes.toFixed(1);
        return `${formatted} min`;
    }

    // =========================================================================
    // Start[cite: 1]
    // =========================================================================
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initGame);
    } else {
        initGame();
    }
})();