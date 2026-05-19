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
    demo_version: '1.1.0',
  });
}

/**
 * Amplitude Cart Analysis–compatible event.
 * Enable property splitting on `context_cards` in Amplitude Data.
 * @see https://amplitude.com/docs/analytics/charts/cart-analysis
 */
export function trackTodayTabCardAnalysis(session) {
  trackEvent('Today Tab Card Analysis', {
    exit_tab: session.exit_tab,
    session_duration_ms: session.session_duration_ms,
    primary_card_type: session.primary_card_type,
    scroll_max_depth_pct: session.scroll_max_depth_pct,
    scroll_event_count: session.scroll_event_count,
    total_scroll_px: session.total_scroll_px,
    cards_viewed_count: session.cards_viewed_count,
    context_cards: session.context_cards,
  });
}

export function trackTodayTabScrolled({ scroll_depth_pct, max_scroll_depth_pct, scroll_event_count }) {
  trackEvent('Today Tab Scrolled', {
    scroll_depth_pct,
    max_scroll_depth_pct,
    scroll_event_count,
  });
}

export function trackContextCardDwelling({ card_type, card_title, dwell_ms, max_visible_pct }) {
  trackEvent('Context Card Dwelling', {
    card_type,
    card_title,
    dwell_ms,
    max_visible_pct,
  });
}

export function trackShortcutTapped(shortcutName, score) {
  trackEvent('Shortcut Tapped', {
    shortcut_name: shortcutName,
    score,
  });
}

export function trackTabTapped(tabName, fromTab) {
  trackEvent('Tab Tapped', {
    tab_name: tabName,
    from_tab: fromTab,
  });
}

export function trackTodayTabEntered() {
  trackEvent('Today Tab Entered', {
    screen: 'today_tab',
  });
}
