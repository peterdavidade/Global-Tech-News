(function () {
    const THEME_KEY = "daily-affairs.theme.v1";
    const THEME_DARK = "dark";
    const THEME_LIGHT = "light";

    function normalizeTheme(value) {
        const theme = String(value || "").trim().toLowerCase();
        return theme === THEME_DARK ? THEME_DARK : THEME_LIGHT;
    }

    function getStoredTheme() {
        try {
            return normalizeTheme(localStorage.getItem(THEME_KEY));
        } catch (error) {
            return THEME_LIGHT;
        }
    }

    function setStoredTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, normalizeTheme(theme));
        } catch (error) {
            // ignore
        }
    }

    function applyTheme(theme) {
        document.documentElement.dataset.theme = normalizeTheme(theme);
    }

    function getActiveTheme() {
        return normalizeTheme(document.documentElement.dataset.theme);
    }

    function updateToggleButtons() {
        const isDark = getActiveTheme() === THEME_DARK;
        const nextThemeLabel = isDark ? "Light mode" : "Dark mode";
        const iconMarkup = isDark
            ? `
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" stroke="currentColor" stroke-width="1.7"/>
                    <path d="M12 2.5v2.6M12 18.9v2.6M21.5 12h-2.6M5.1 12H2.5M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8M18.6 18.6l-1.8-1.8M7.2 7.2 5.4 5.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
                </svg>
            `
            : `
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21 13.2A7.8 7.8 0 0 1 10.8 3a7 7 0 1 0 10.2 10.2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
                </svg>
            `;
        document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
            if (!(button instanceof HTMLElement)) {
                return;
            }

            button.setAttribute("aria-label", `Switch to ${nextThemeLabel}`);
            button.setAttribute("title", nextThemeLabel);
            button.innerHTML = iconMarkup;
        });
    }

    function toggleTheme() {
        const next = getActiveTheme() === THEME_DARK ? THEME_LIGHT : THEME_DARK;
        applyTheme(next);
        setStoredTheme(next);
        updateToggleButtons();
    }

    applyTheme(getStoredTheme());

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", updateToggleButtons, { once: true });
    } else {
        updateToggleButtons();
    }

    document.addEventListener("click", (event) => {
        const button = event.target?.closest?.("[data-theme-toggle]");
        if (!button) {
            return;
        }

        event.preventDefault();
        toggleTheme();
    });

    window.DailyAffairsTheme = {
        applyTheme,
        toggleTheme,
        getActiveTheme
    };
})();
