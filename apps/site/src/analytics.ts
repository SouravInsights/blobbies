import posthog from 'posthog-js';

type AnalyticsProperties = Record<string, string | number | boolean>;

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST;

let ready = false;

/**
 * The app is one page; the query string is only used for demo/screenshot
 * controls (?only=picker, ?theme=light, ?stress=1). Keep those out of the
 * pageview so web analytics shows one clean landing page.
 */
function pageUrl(): string {
  return window.location.origin + window.location.pathname;
}

export function initAnalytics(): void {
  if (!KEY || !HOST) return;
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const optOut = params.get('ph_opt_out') === 'true';
  const optIn = params.get('ph_opt_in') === 'true';

  posthog.init(KEY, {
    api_host: HOST,
    defaults: '2026-08-30',
    // Anonymous visitors do not need a person profile; identified ones still
    // get one if we ever call posthog.identify().
    person_profiles: 'identified_only',
    // Pageviews are captured manually below, after the opt-out check.
    capture_pageview: false,
    capture_pageleave: true,
    // Web vitals (LCP, CLS, INP, FCP, TTFB) for the Web Analytics dashboard.
    capture_performance: true,
    // Only deliberate events; no catch-all click noise.
    autocapture: false,
    // Keep the project light: no session recording unless it is turned on in
    // the PostHog project settings and this flag is removed.
    disable_session_recording: true,
    respect_dnt: true,
    // `?ph_opt_out=true` stops the very first pageview as well.
    opt_out_capturing_by_default: optOut,
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
    loaded: (ph) => {
      if (optOut) {
        ph.opt_out_capturing();
        alert('PostHog: Tracking disabled for this browser.');
        return;
      }
      if (optIn) {
        ph.opt_in_capturing();
        alert('PostHog: Tracking re-enabled for this browser.');
      }
      if (!ph.has_opted_out_capturing()) {
        ph.capture('$pageview', { $current_url: pageUrl() });
      }
    },
  });

  ready = true;
}

/** A deliberate product action. Silent when analytics is off or opted out. */
export function captureEvent(event: string, properties?: AnalyticsProperties): void {
  if (!ready || posthog.has_opted_out_capturing()) return;
  posthog.capture(event, properties);
}