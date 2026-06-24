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
 * Single scroll-stop event with card-key arrays:
 * { card_status: [{ card_key: "sleep", is_viewed: true, is_analysed: true }, ...], scroll_depth_pct: 64 }
 */
export function trackTodayTabScrollStopped(cartPayload) {
  if (!initialized) return;
  amplitude.logEvent('Today Tab Scroll Stopped', cartPayload);
}
