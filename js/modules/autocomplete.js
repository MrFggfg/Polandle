(function (root) {
    "use strict";

    const modules = root.PolandleModules = root.PolandleModules || {};

    function bindAutocomplete({ input, list, items, getName, isExcluded, onSelect, limit = 24 }) {
        if (!input || !list) return;
        let focus = -1;

        function close() {
            list.replaceChildren();
            focus = -1;
            input.setAttribute("aria-expanded", "false");
            input.setAttribute("aria-activedescendant", "");
        }

        function render() {
            const text = input.value.toLocaleLowerCase().trim();
            close();
            if (!text) return;
            const matches = items.filter(item => {
                const name = getName(item);
                return name.toLocaleLowerCase().includes(text) && !isExcluded(item);
            }).slice(0, limit);

            matches.forEach((item, index) => {
                const option = document.createElement("div");
                option.id = `${list.id}-option-${index}`;
                option.setAttribute("role", "option");
                option.textContent = getName(item);
                option.addEventListener("click", () => onSelect(getName(item)));
                list.appendChild(option);
            });
            input.setAttribute("aria-expanded", String(matches.length > 0));
        }

        function move(step) {
            const options = [...list.querySelectorAll('[role="option"]')];
            if (!options.length) return;
            focus = (focus + step + options.length) % options.length;
            options.forEach(option => option.classList.remove("suggestion-active"));
            options[focus].classList.add("suggestion-active");
            options[focus].scrollIntoView({ block: "nearest" });
            input.setAttribute("aria-activedescendant", options[focus].id);
        }

        input.addEventListener("input", render);
        input.addEventListener("keydown", event => {
            if (event.key === "ArrowDown") { event.preventDefault(); move(1); }
            if (event.key === "ArrowUp") { event.preventDefault(); move(-1); }
            if (event.key === "Escape") close();
            if (event.key === "Enter") {
                const active = list.querySelector(".suggestion-active");
                if (active) { event.preventDefault(); onSelect(active.textContent); }
            }
        });
        document.addEventListener("click", event => {
            if (event.target !== input && !list.contains(event.target)) close();
        });

        return { close };
    }

    modules.autocomplete = { bindAutocomplete };
})(window);
