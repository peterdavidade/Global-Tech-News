(function () {
    const config = window.__FIREBASE_CONFIG__;

    if (!config || typeof config !== "object") {
        return;
    }

    const hasRequiredConfig = Boolean(config.apiKey && config.authDomain && config.projectId);

    if (!hasRequiredConfig) {
        return;
    }

    if (!window.firebase || typeof window.firebase.initializeApp !== "function") {
        return;
    }

    try {
        if (!window.firebase.apps?.length) {
            window.firebase.initializeApp(config);
        }
    } catch (error) {
        return;
    }

    try {
        const app = window.firebase.app();
        const auth = window.firebase.auth();
        const db = window.firebase.firestore();
        const storage = typeof window.firebase.storage === "function" ? window.firebase.storage() : null;

        // Keep Storage retries bounded so the admin UI doesn't appear to "hang" forever
        // when Storage isn't enabled or a network/proxy blocks uploads.
        try {
            if (storage?.setMaxUploadRetryTime) {
                storage.setMaxUploadRetryTime(60 * 1000);
            }
            if (storage?.setMaxOperationRetryTime) {
                storage.setMaxOperationRetryTime(60 * 1000);
            }
        } catch (error) {
            // Ignore.
        }

        window.FirebaseNewsroom = {
            app,
            auth,
            db,
            storage,
            isConfigured: true
        };
    } catch (error) {
        // Ignore init errors; the site will fall back to localStorage mode.
    }
})();
