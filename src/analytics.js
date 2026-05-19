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

export function trackEvent(eventName, eventProperties = {}) {
  if (!initialized) return;
  amplitude.track(eventName, eventProperties);
}

export function trackDemoViewed() {
  trackEvent('Demo Viewed', {
    screen: 'today_tab',
    demo_version: '1.0.0',
  });
}

export function trackCardSelected(cardType, source) {
  trackEvent('Card Selected', {
    card_type: cardType,
    source,
  });
}

export function trackCardAnalyzeClicked(cardType) {
  trackEvent('Card Analyze Clicked', {
    card_type: cardType,
  });
}

export function trackCardAnalysisStarted(cardType) {
  trackEvent('Card Analysis Started', {
    card_type: cardType,
  });
}

export function trackCardAnalysisCompleted(cardType, confidence) {
  trackEvent('Card Analysis Completed', {
    card_type: cardType,
    confidence_score: confidence,
  });
}

export function trackShortcutTapped(shortcutName, score) {
  trackEvent('Shortcut Tapped', {
    shortcut_name: shortcutName,
    score,
  });
}

export function trackTabTapped(tabName) {
  trackEvent('Tab Tapped', {
    tab_name: tabName,
  });
}
