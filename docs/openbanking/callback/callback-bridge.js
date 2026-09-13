var OpenBankingCallbackBridge = (function () {
    "use strict";

    var appCallbackBase = "financialdashboard://openbanking/callback";
    var acceptedNames = {
        code: true,
        state: true,
        error: true
    };

    function decodeQueryValue(value) {
        try {
            return decodeURIComponent(value.replace(/\+/g, " "));
        } catch (_) {
            return null;
        }
    }

    function parseQuery(search) {
        if (typeof search !== "string") {
            return null;
        }

        var query = search.charAt(0) === "?" ? search.slice(1) : search;
        if (query.length === 0) {
            return [];
        }

        var entries = [];
        var components = query.split("&");
        for (var index = 0; index < components.length; index += 1) {
            var component = components[index];
            if (component.length === 0) {
                return null;
            }

            var separator = component.indexOf("=");
            var rawName = separator === -1 ? component : component.slice(0, separator);
            var rawValue = separator === -1 ? "" : component.slice(separator + 1);
            var name = decodeQueryValue(rawName);
            var value = decodeQueryValue(rawValue);
            if (name === null || value === null) {
                return null;
            }
            entries.push([name, value]);
        }
        return entries;
    }

    function buildCallback(search) {
        var entries = parseQuery(search);
        if (entries === null) {
            return null;
        }

        var values = { code: [], state: [], error: [] };
        for (var index = 0; index < entries.length; index += 1) {
            var name = entries[index][0];
            if (acceptedNames[name] === true) {
                values[name].push(entries[index][1]);
            }
        }

        if (values.state.length !== 1 || values.state[0].length === 0) {
            return null;
        }

        var hasCode = values.code.length === 1
            && values.code[0].length > 0
            && values.error.length === 0;
        var hasError = values.error.length === 1
            && values.error[0].length > 0
            && values.code.length === 0;
        if (!hasCode && !hasError) {
            return null;
        }

        var terminalName = hasCode ? "code" : "error";
        var terminalValue = hasCode ? values.code[0] : values.error[0];
        return appCallbackBase
            + "?" + terminalName + "=" + encodeURIComponent(terminalValue)
            + "&state=" + encodeURIComponent(values.state[0]);
    }

    function runBrowserBridge() {
        var status = document.getElementById("callback-status");
        var returnLink = document.getElementById("return-to-app");
        var callback = buildCallback(globalThis.location.search);

        if (callback === null) {
            status.textContent =
                "Il risultato dell’autorizzazione non è valido. Chiudi questa pagina e riprova dall’app.";
            returnLink.hidden = true;
            return;
        }

        returnLink.href = callback;
        returnLink.hidden = false;
        status.textContent = "Autorizzazione completata. Ritorno a Financial Dashboard…";

        try {
            globalThis.location.replace(callback);
        } catch (_) {
            status.textContent =
                "Autorizzazione completata. Tocca il pulsante per tornare a Financial Dashboard.";
        }
    }

    if (typeof document !== "undefined" && typeof globalThis.location !== "undefined") {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", runBrowserBridge, { once: true });
        } else {
            runBrowserBridge();
        }
    }

    return {
        buildCallback: buildCallback,
        runBrowserBridge: runBrowserBridge
    };
}());
