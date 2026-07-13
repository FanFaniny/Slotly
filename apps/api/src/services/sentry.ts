import { serverEnv } from "@slotly/shared/env";

export async function initSentry() {
  if (!serverEnv.SENTRY_DSN) {
    console.info("[sentry] SENTRY_DSN not set — error tracking disabled");
    return;
  }

  try {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn: serverEnv.SENTRY_DSN,
      environment: serverEnv.NODE_ENV,
      tracesSampleRate: serverEnv.NODE_ENV === "production" ? 0.1 : 1.0,
    });
    console.info("[sentry] Initialized");
  } catch (error) {
    console.warn("[sentry] Failed to initialize:", error);
  }
}

export async function captureException(error: unknown) {
  if (!serverEnv.SENTRY_DSN) return;

  try {
    const Sentry = await import("@sentry/node");
    Sentry.captureException(error);
  } catch {
    // Sentry not available
  }
}
