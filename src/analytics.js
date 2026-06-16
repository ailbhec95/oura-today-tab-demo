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
 * Amplitude Cart Analysis format:
 * @see https://amplitude.com/docs/analytics/charts/cart-analysis
 *
 * amplitude.logEvent('Event Name', {
 *   today_tab_cards: [
 *     { card_id: 1, card_name: 'Sleep', is_viewed: true, is_analysed: false },
 *   ],
 * });
 */
export function trackTodayTabCartAnalysisScrollStopped(cartObjectArray) {
  if (!initialized) return;
  amplitude.logEvent('Today Tab Cart Analysis Scroll Stopped', cartObjectArray);
}
