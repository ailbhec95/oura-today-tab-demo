import * as amplitude from '@amplitude/analytics-browser';

const API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;

let initialized = false;

export function initAnalytics() {
  if (initialized || !API_KEY) {
    if (!API_KEY) {
      console.warn('[Amplitude] Missing VITE_AMPLITUDE_API_KEY');
    }
    return;
  }

  amplitude.init(API_KEY);
  initialized = true;
}

function trackEvent(eventName, eventProperties = {}) {
  if (!initialized) return;
  amplitude.track(eventName, eventProperties);
}

/**
 * Amplitude Cart Analysis–compatible event.
 * Enable property splitting on `context_cards` in Amplitude Data.
 * @see https://amplitude.com/docs/analytics/charts/cart-analysis
 */
export function trackTodayTabCartAnalysisScrollStopped({
  scroll_depth_pct,
  context_cards,
}) {
  trackEvent('Today Tab Cart Analysis Scroll Stopped', {
    scroll_depth_pct,
    context_cards,
  });
}
