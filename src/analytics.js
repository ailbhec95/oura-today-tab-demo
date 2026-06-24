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

/**
 * Single-event Cart Analysis payload.
 * Enable property splitting on `today_tab_cards` in Amplitude Data.
 * @see https://amplitude.com/docs/analytics/charts/cart-analysis
 */
export function trackTodayTabScrollStopped(cartPayload) {
  if (!initialized) return;
  amplitude.logEvent('Today Tab Scroll Stopped', cartPayload);
}
