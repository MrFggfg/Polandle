(function () {
    "use strict";

    const shared = window.PolandleModules;
    const ranking = shared && shared.ranking;

    const poolLabels = {
        gorne: "mapy gorne",
        dolne: "mapy dolne",
        pomieszczenia: "pomieszczenia"
    };
    const CHALLENGE_SECONDS = 60;
    const CHALLENGE_BEST_KEY = "polandle:map-challenge-best:v1";
    const revealStart = 36;
    const revealStep = 28;
    const state = {
        mode: "classic",
        target: null,
        wrongAnswers: 0,
        revealX: 50,
        revealY: 50,
        gameOver: true,
        score: 0,
        timeLeft: CHALLENGE_SECONDS,
        timerId: null,
        best: 0,
        bestAtStart: 0
    };

    const image = document.getElementById("map-image");
    const stage = document.getElementById("map-stage");
    const input = document.getElementById("map-guess-input");
    const submitButton = document.getElementById("map-submit-button");
    const newMapButton = document.getElementById("new-map-button");
    const challengeStartButton = document.getElementById("challenge-start-button");
    const giveUpButton = document.getElementById("map-giveup-button");
    const challengeHud = document.getElementById("challenge-hud");
    const challengeTime = document.getElementById("challenge-time");
    const challengeScore = document.getElementById("challenge-score");
    const challengeBest = document.getElementById("challenge-best");
    const status = document.getElementById("map-status");
    const progress = document.getElementById("map-progress");

    function loadBest() {
        const raw = Number(localStorage.getItem(CHALLENGE_BEST_KEY));
        return Number.isFinite(raw) && raw > 0 ? raw : 0;
    }

    function saveBest(value) {
        try { localStorage.setItem(CHALLENGE_BEST_KEY, String(value)); } catch { /* Storage may be unavailable. */ }
    }

    function updateBestDisplay() {
        if (challengeBest) challengeBest.textContent = String(state.best);
    }

    function updateHud() {
        if (challengeTime) challengeTime.textContent = String(Math.max(0, state.timeLeft));
        if (challengeScore) challengeScore.textContent = String(state.score);
    }

    function normalize(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function getSelectedPools() {
        return [...document.querySelectorAll('input[name="map-pool"]:checked')]
            .map(checkbox => checkbox.value);
    }

    function getPool() {
        // Tryb wyzwania: losujemy ze WSZYSTKICH pul map.
        // Tryb klasyczny: tylko z zaznaczonych pul.
        const pools = state.mode === "challenge"
            ? Object.keys(mapPools)
            : getSelectedPools();
        return pools.flatMap(pool =>
            (mapPools[pool] || []).map(map => ({ ...map, pool }))
        );
    }

    function getMapPath(map) {
        return `images/mapki/${map.pool}/${map.file}`;
    }

    function setReveal(pixels) {
        const position = `${state.revealX}% ${state.revealY}%`;
        image.style.clipPath = `circle(${pixels}px at ${position})`;
        image.style.webkitClipPath = `circle(${pixels}px at ${position})`;
        stage.style.setProperty("--reveal-x", `${state.revealX}%`);
        stage.style.setProperty("--reveal-y", `${state.revealY}%`);
    }

    function updateProgress() {
        const revealed = revealStart + state.wrongAnswers * revealStep;
        progress.textContent = `Bledne odpowiedzi: ${state.wrongAnswers}. Odkryty promien: ${revealed}px.`;
        setReveal(revealed);
    }

    function stopTimer() {
        if (state.timerId !== null) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
    }

    function startTimer() {
        stopTimer();
        state.timerId = setInterval(() => {
            state.timeLeft -= 1;
            updateHud();
            if (state.timeLeft <= 0) {
                stopTimer();
                finishChallenge();
            }
        }, 1000);
    }

    function finishChallenge() {
        stopTimer();
        state.gameOver = true;
        input.disabled = true;
        submitButton.disabled = true;
        const isNewBest = state.score > state.bestAtStart;
        if (isNewBest) {
            state.best = state.score;
            saveBest(state.best);
            updateBestDisplay();
        }
        status.textContent = `Koniec czasu! Trafienia: ${state.score}.` +
            (isNewBest ? " To nowy rekord!" : ` Rekord: ${state.best}.`);
        progress.textContent = "Wyzwanie zakonczone. Kliknij „Start wyzwania”, aby zagrac ponownie.";
        if (ranking) ranking.recordChallenge(state.score);
        if (challengeStartButton) {
            challengeStartButton.textContent = "Zagraj ponownie";
            challengeStartButton.disabled = false;
        }
    }

    function applyMode() {
        const isChallenge = state.mode === "challenge";
        if (challengeHud) challengeHud.classList.toggle("hidden", !isChallenge);
        if (challengeStartButton) challengeStartButton.classList.toggle("hidden", !isChallenge);
        if (newMapButton) newMapButton.classList.toggle("hidden", isChallenge);
        if (giveUpButton) giveUpButton.classList.toggle("hidden", isChallenge);

        // W trybie wyzwania losujemy ze wszystkich map – checkboxy pul
        // są wtedy nieaktywne (dotyczą tylko trybu klasycznego).
        document.querySelectorAll('input[name="map-pool"]').forEach(checkbox => {
            checkbox.disabled = isChallenge;
        });
        const poolOptions = document.querySelector(".map-pool-options");
        if (poolOptions) poolOptions.classList.toggle("map-pool-disabled", isChallenge);
    }

    function startChallenge() {
        stopTimer();
        state.mode = "challenge";
        state.score = 0;
        state.bestAtStart = state.best;
        state.timeLeft = CHALLENGE_SECONDS;
        state.gameOver = false;
        updateHud();
        updateBestDisplay();
        applyMode();
        if (challengeStartButton) challengeStartButton.textContent = "Restart";
        const pool = getPool();
        if (pool.length === 0) {
            status.textContent = "Zaznacz przynajmniej jedna pule map.";
            return;
        }
        startRound();
        startTimer();
    }

    function setMode(mode) {
        state.mode = mode === "challenge" ? "challenge" : "classic";
        applyMode();
        if (state.mode === "challenge") {
            startChallenge();
        } else {
            stopTimer();
            state.score = 0;
            state.timeLeft = CHALLENGE_SECONDS;
            updateHud();
            applyMode();
            startRound();
        }
    }

    function getMode() {
        const checked = document.querySelector('input[name="map-mode"]:checked');
        return checked ? checked.value : "classic";
    }

    function startRound() {
        const pool = getPool();
        if (pool.length === 0) {
            state.target = null;
            state.gameOver = true;
            input.disabled = true;
            submitButton.disabled = true;
            status.textContent = "Zaznacz przynajmniej jedna pule map.";
            progress.textContent = "Brak wybranych map.";
            image.removeAttribute("src");
            return;
        }

        state.target = pool[Math.floor(Math.random() * pool.length)];
        state.wrongAnswers = 0;
        state.revealX = Math.round(18 + Math.random() * 64);
        state.revealY = Math.round(18 + Math.random() * 64);
        state.gameOver = false;
        input.disabled = false;
        submitButton.disabled = false;
        if (giveUpButton) giveUpButton.disabled = false;
        input.value = "";
        status.textContent = `Wylosowano z puli: ${poolLabels[state.target.pool]}.`;
        image.alt = "Zakryty fragment mapy";
        image.classList.add("map-image-loading", "map-image-resetting");
        setReveal(revealStart);
        image.src = getMapPath(state.target);
        updateProgress();
        input.focus();
    }

    function submitGuess() {
        if (state.gameOver || !state.target) return;
        const guess = normalize(input.value);
        if (!guess) return;

        const answer = normalize(state.target.name);
        const fileAnswer = normalize(state.target.file.replace(/\.png$/i, ""));
        if (guess === answer || guess === fileAnswer || answer.includes(guess) && guess.length >= 4) {
            const solvedName = state.target.name;

            if (state.mode === "challenge") {
                state.score += 1;
                if (state.score > state.best) {
                    state.best = state.score;
                    saveBest(state.best);
                    updateBestDisplay();
                }
                updateHud();
                startRound();
                status.textContent = `Dobrze! To mapa: ${solvedName}. Trafienia: ${state.score}.`;
                return;
            }

            // Tryb klasyczny: po trafieniu od razu losujemy kolejna mape.
            startRound();
            status.textContent = `Dobrze! To mapa: ${solvedName}. Losuje kolejna...`;
            return;
        }

        state.wrongAnswers += 1;
        input.value = "";
        updateProgress();
        status.textContent = "Nie tym razem. Odkryto kolejny fragment mapy.";
        input.focus();
    }

    function giveUp() {
        if (state.gameOver || !state.target) return;
        state.gameOver = true;
        input.disabled = true;
        submitButton.disabled = true;
        if (giveUpButton) giveUpButton.disabled = true;
        image.style.clipPath = "circle(150% at 50% 50%)";
        image.style.webkitClipPath = "circle(150% at 50% 50%)";
        image.alt = `Mapa: ${state.target.name}`;
        status.textContent = `Poddajesz sie! To byla mapa: ${state.target.name}.`;
        progress.textContent = "Kliknij „Losuj mapke”, aby zagrac ponownie.";
    }

    document.querySelectorAll('input[name="map-pool"]').forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            if (state.gameOver || state.mode === "classic") startRound();
        });
    });

    document.querySelectorAll('input[name="map-mode"]').forEach(radio => {
        radio.addEventListener("change", () => {
            if (radio.checked) setMode(radio.value);
        });
    });

    if (newMapButton) newMapButton.addEventListener("click", startRound);
    if (challengeStartButton) challengeStartButton.addEventListener("click", startChallenge);
    if (giveUpButton) giveUpButton.addEventListener("click", giveUp);
    submitButton.addEventListener("click", submitGuess);
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") submitGuess();
    });

    // Tryb klasyczny: po zakonczeniu rundy (trafienie/poddanie) nacisnij
    // Enter, aby wylosowac kolejna mape.
    document.addEventListener("keydown", event => {
        if (event.key !== "Enter") return;
        if (state.mode !== "classic" || !state.gameOver) return;
        event.preventDefault();
        startRound();
    });
    image.addEventListener("error", () => {
        image.classList.remove("map-image-loading", "map-image-resetting");
        status.textContent = "Nie udalo sie wczytac tej grafiki mapy.";
        state.gameOver = true;
        input.disabled = true;
        submitButton.disabled = true;
    });
    image.addEventListener("load", () => image.classList.remove("map-image-loading", "map-image-resetting"));

    state.best = loadBest();
    updateBestDisplay();
    state.mode = getMode();
    if (state.mode === "challenge") {
        startChallenge();
    } else {
        applyMode();
        startRound();
    }

    if (shared && shared.rankingUI) {
        shared.rankingUI.mount({
            category: "mapsChallenge",
            title: "Ranking — Wyzwanie Map",
            challenge: true,
            icon: true
        });
    }
})();
