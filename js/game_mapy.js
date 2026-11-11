(function () {
    "use strict";

    const poolLabels = {
        gorne: "mapy gorne",
        dolne: "mapy dolne",
        pomieszczenia: "pomieszczenia"
    };
    const revealStart = 36;
    const revealStep = 28;
    const state = {
        target: null,
        wrongAnswers: 0,
        revealX: 50,
        revealY: 50,
        gameOver: true
    };

    const image = document.getElementById("map-image");
    const stage = document.getElementById("map-stage");
    const input = document.getElementById("map-guess-input");
    const submitButton = document.getElementById("map-submit-button");
    const newMapButton = document.getElementById("new-map-button");
    const status = document.getElementById("map-status");
    const progress = document.getElementById("map-progress");

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
        return getSelectedPools().flatMap(pool =>
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
            state.gameOver = true;
            input.disabled = true;
            submitButton.disabled = true;
            image.style.clipPath = `circle(150% at ${state.revealX}% ${state.revealY}%)`;
            image.style.webkitClipPath = `circle(150% at ${state.revealX}% ${state.revealY}%)`;
            image.alt = `Mapa: ${state.target.name}`;
            status.textContent = `Dobrze! To mapa: ${state.target.name}.`;
            progress.textContent = `Pula: ${poolLabels[state.target.pool]} | Bledne odpowiedzi: ${state.wrongAnswers}`;
            return;
        }

        state.wrongAnswers += 1;
        input.value = "";
        updateProgress();
        status.textContent = "Nie tym razem. Odkryto kolejny fragment mapy.";
        input.focus();
    }

    document.querySelectorAll('input[name="map-pool"]').forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            if (state.gameOver) startRound();
        });
    });
    newMapButton.addEventListener("click", startRound);
    submitButton.addEventListener("click", submitGuess);
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") submitGuess();
    });
    image.addEventListener("error", () => {
        image.classList.remove("map-image-loading", "map-image-resetting");
        status.textContent = "Nie udalo sie wczytac tej grafiki mapy.";
        state.gameOver = true;
        input.disabled = true;
        submitButton.disabled = true;
    });
    image.addEventListener("load", () => image.classList.remove("map-image-loading", "map-image-resetting"));

    startRound();
})();
