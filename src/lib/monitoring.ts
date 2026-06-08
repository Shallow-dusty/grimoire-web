import * as Sentry from '@sentry/react';
import { env } from '../config/env';

let initialized = false;

const shouldEnableSentry = (): boolean => {
  if (!env.SENTRY_DSN) return false;
  if (env.IS_DEV) return false;
  return true;
};

const SENSITIVE_KEYS = /password|secret|token|auth|api[-_]?key|session/i;

const scrubObject = (input: unknown, depth = 0): unknown => {
  if (depth > 4 || input == null) return input;
  if (Array.isArray(input)) return input.map((v) => scrubObject(v, depth + 1));
  if (typeof input !== 'object') return input;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEYS.test(k) ? '[redacted]' : scrubObject(v, depth + 1);
  }
  return out;
};

export const initMonitoring = (): void => {
  if (initialized || !shouldEnableSentry()) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? (env.IS_DEV ? 'development' : 'production'),
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.Cookie;
          delete event.request.headers.Authorization;
        }
      }
      if (event.contexts) {
        event.contexts = scrubObject(event.contexts) as typeof event.contexts;
      }
      if (event.extra) {
        event.extra = scrubObject(event.extra) as typeof event.extra;
      }
      return event;
    },
  });

  initialized = true;
};

export const captureException = (error: unknown, context?: Record<string, unknown>): void => {
  if (!shouldEnableSentry()) return;
  Sentry.captureException(error, {
    contexts: context ? { app: context } : undefined,
  });
};

export const captureMessage = (message: string, context?: Record<string, unknown>): void => {
  if (!shouldEnableSentry()) return;
  Sentry.captureMessage(message, {
    contexts: context ? { app: context } : undefined,
  });
};
