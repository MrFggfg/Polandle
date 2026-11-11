(function () {
    if (document.getElementById('snow-layer')) return;

    const layer = document.createElement('div');
    layer.id = 'snow-layer';
    layer.setAttribute('aria-hidden', 'true');

    const count = 155;
    for (let i = 0; i < count; i++) {
        const flake = document.createElement('span');
        flake.className = 'snowflake';

        const size = (Math.random() * 4 + 2).toFixed(2) + 'px';
        const left = (Math.random() * 100).toFixed(2) + '%';
        const duration = (Math.random() * 12 + 10).toFixed(2) + 's';
        const delay = (Math.random() * 12).toFixed(2) + 's';
        const drift = (Math.random() * 25 - 12).toFixed(2) + 'px';
        const opacity = (Math.random() * 0.7 + 0.3).toFixed(2);

        flake.style.width = size;
        flake.style.height = size;
        flake.style.left = left;
        flake.style.animationDuration = duration;
        flake.style.animationDelay = delay;
        flake.style.setProperty('--drift', drift);
        flake.style.opacity = opacity;

        layer.appendChild(flake);
    }

    document.body.appendChild(layer);
})();
