(function () {
    "use strict";

    if ("serviceWorker" in navigator && (location.protocol === "http:" || location.protocol === "https:")) {
        navigator.serviceWorker.register("sw.js").catch(() => {
            // Offline support is optional when the page is opened as a local file.
        });
    }
})();