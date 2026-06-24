import * as amplitude from '@amplitude/analytics-browser';

const API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;

let initialized = false;

export function initAnalytics() {
  if (initialized || !API_KEY) {
    if (!API_KEY) console.warn('[Amplitude] Missing VITE_AMPLITUDE_API_KEY');
    return;
  }

  amplitude.init(API_KEY);
  initialized = true;
}

/** One event per Today tab visit — fired when the user leaves Today. */
export function trackTodayTabVisitEnded(payload) {
  if (!initialized) return;
  amplitude.logEvent('Today Tab Visit Ended', payload);
}
