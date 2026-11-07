(function (root) {
    "use strict";

    const modules = root.PolandleModules = root.PolandleModules || {};

    function bindModal({ modal, openButton, closeButton, render }) {
        if (!modal) return;
        let lastFocus = null;

        function close() {
            modal.classList.remove("active");
            modal.classList.add("hidden");
            modal.setAttribute("hidden", "true");
            modal.setAttribute("aria-hidden", "true");
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        function open() {
            if (render) render();
            lastFocus = document.activeElement;
            modal.classList.remove("hidden");
            modal.removeAttribute("hidden");
            modal.classList.add("active");
            modal.setAttribute("aria-hidden", "false");
            closeButton?.focus();
        }

        openButton?.addEventListener("click", open);
        closeButton?.addEventListener("click", close);
        modal.addEventListener("click", event => { if (event.target === modal) close(); });
        document.addEventListener("keydown", event => { if (event.key === "Escape" && modal.classList.contains("active")) close(); });
    }

    modules.modal = { bindModal };
})(window);
