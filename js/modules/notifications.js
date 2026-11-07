(function (root) {
    "use strict";

    const modules = root.PolandleModules = root.PolandleModules || {};

    function toast(message, kind = "info", container = document.getElementById("toast-container")) {
        if (!container) return;
        const element = document.createElement("div");
        element.className = `toast toast-${kind}`;
        element.textContent = message;
        container.appendChild(element);
        window.setTimeout(() => element.classList.add("toast-out"), 2200);
        window.setTimeout(() => element.remove(), 2800);
    }

    modules.notifications = { toast };
})(window);
