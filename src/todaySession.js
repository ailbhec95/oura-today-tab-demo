/**
 * Tracks dwell time on context cards and scroll behavior while the user
 * is on the Today tab. Flushed when the tab is left.
 */

const DWELL_THRESHOLD_MS = 500;
const SCROLL_DEBOUNCE_MS = 150;

export class TodayTabSessionTracker {
  constructor({ scrollContainer, cardSelector = '.card, .daily-highlight' }) {
    this.scrollEl = scrollContainer;
    this.cardSelector = cardSelector;
    this.sessionStartedAt = Date.now();
    this.cardStats = new Map();
    this.activeDwell = new Map();
    this.scrollEventCount = 0;
    this.maxScrollDepthPct = 0;
    this.totalScrollPx = 0;
    this.lastScrollTop = 0;
    this.observer = null;
    this.scrollDebounceTimer = null;
    this.onScrollDepth = null;
  }

  start() {
    this.sessionStartedAt = Date.now();
    this.observeCards();
    this.bindScroll();
  }

  stop() {
    this.finalizeAllDwell();
    this.observer?.disconnect();
    this.observer = null;
    if (this.scrollEl) {
      this.scrollEl.removeEventListener('scroll', this._onScroll);
    }
    clearTimeout(this.scrollDebounceTimer);
  }

  observeCards() {
    const elements = document.querySelectorAll(this.cardSelector);
    elements.forEach((el) => this.initCardStat(el));

    this.observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => this.handleIntersection(entry)),
      { root: this.scrollEl, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    elements.forEach((el) => this.observer.observe(el));
  }

  initCardStat(el) {
    const cardType =
      el.dataset.card ??
      (el.classList.contains('daily-highlight') ? 'daily_highlight' : 'unknown');
    const cardTitle =
      el.querySelector('h3')?.textContent ??
      el.querySelector('h2')?.textContent ??
      cardType;

    if (!this.cardStats.has(el)) {
      this.cardStats.set(el, {
        card_type: cardType,
        card_title: cardTitle,
        dwell_ms: 0,
        max_visible_pct: 0,
        impressions: 0,
        was_tapped: false,
        tap_count: 0,
      });
    }
  }

  handleIntersection(entry) {
    const el = entry.target;
    this.initCardStat(el);
    const stat = this.cardStats.get(el);
    const visiblePct = Math.round(entry.intersectionRatio * 100);

    stat.max_visible_pct = Math.max(stat.max_visible_pct, visiblePct);

    if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
      if (!this.activeDwell.has(el)) {
        stat.impressions += 1;
        this.activeDwell.set(el, Date.now());
      }
    } else if (this.activeDwell.has(el)) {
      this.finalizeDwell(el);
    }
  }

  finalizeDwell(el) {
    const started = this.activeDwell.get(el);
    if (!started) return;

    const stat = this.cardStats.get(el);
    const elapsed = Date.now() - started;
    if (elapsed >= DWELL_THRESHOLD_MS) {
      stat.dwell_ms += elapsed;
    }
    this.activeDwell.delete(el);
  }

  finalizeAllDwell() {
    for (const el of this.activeDwell.keys()) {
      this.finalizeDwell(el);
    }
  }

  recordCardTap(el) {
    this.initCardStat(el);
    const stat = this.cardStats.get(el);
    stat.was_tapped = true;
    stat.tap_count += 1;
  }

  bindScroll() {
    if (!this.scrollEl) return;
    this._onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = this.scrollEl;
      const depthPct = Math.round(
        (scrollTop / Math.max(scrollHeight - clientHeight, 1)) * 100
      );
      this.maxScrollDepthPct = Math.max(this.maxScrollDepthPct, depthPct);
      this.totalScrollPx += Math.abs(scrollTop - this.lastScrollTop);
      this.lastScrollTop = scrollTop;
      this.scrollEventCount += 1;

      clearTimeout(this.scrollDebounceTimer);
      this.scrollDebounceTimer = setTimeout(() => {
        this.onScrollDepth?.({
          scroll_depth_pct: depthPct,
          max_scroll_depth_pct: this.maxScrollDepthPct,
          scroll_event_count: this.scrollEventCount,
        });
      }, SCROLL_DEBOUNCE_MS);
    };
    this.scrollEl.addEventListener('scroll', this._onScroll, { passive: true });
  }

  getPrimaryCardType(contextCards) {
    if (!contextCards.length) return null;
    return [...contextCards].sort((a, b) => b.dwell_ms - a.dwell_ms)[0].card_type;
  }

  flush(exitTab) {
    this.finalizeAllDwell();

    const context_cards = [...this.cardStats.values()]
      .filter((c) => c.dwell_ms > 0 || c.was_tapped || c.impressions > 0)
      .map(({ card_type, card_title, dwell_ms, max_visible_pct, impressions, was_tapped, tap_count }) => ({
        card_type,
        card_title,
        dwell_ms,
        max_visible_pct,
        impressions,
        was_tapped,
        tap_count,
      }));

    const session_duration_ms = Date.now() - this.sessionStartedAt;

    return {
      exit_tab: exitTab,
      session_duration_ms,
      primary_card_type: this.getPrimaryCardType(context_cards),
      context_cards,
      scroll_max_depth_pct: this.maxScrollDepthPct,
      scroll_event_count: this.scrollEventCount,
      total_scroll_px: Math.round(this.totalScrollPx),
      cards_viewed_count: context_cards.length,
    };
  }

  reset() {
    this.stop();
    this.cardStats.clear();
    this.activeDwell.clear();
    this.scrollEventCount = 0;
    this.maxScrollDepthPct = 0;
    this.totalScrollPx = 0;
    this.lastScrollTop = 0;
    this.sessionStartedAt = Date.now();
    this.start();
  }
}
