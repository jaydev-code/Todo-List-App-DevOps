/**
 * Sentry Configuration for Error Tracking
 * To be initialized in app.js if SENTRY_DSN is provided
 */

const SENTRY_CONFIG = {
    dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
    environment: "production",
    tracesSampleRate: 1.0,
    integrations: [],
};

function initSentry() {
    if (typeof Sentry !== 'undefined') {
        Sentry.init(SENTRY_CONFIG);
        console.log("Sentry Monitoring Initialized");
    } else {
        console.warn("Sentry SDK not loaded, skipping monitoring init.");
    }
}

// export { initSentry };
