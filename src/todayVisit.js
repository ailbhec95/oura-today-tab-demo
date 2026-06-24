const DWELL_THRESHOLD_MS = 400;
const VISIBLE_RATIO_THRESHOLD = 0.25;

export class TodayTabVisitTracker {
  constructor({ scrollContainer, shortcutsContainer, trackedItems }) {
    this.scrollEl = scrollContainer;
    this.shortcutsEl = shortcutsContainer;
    this.trackedItems = trackedItems;
    this.visitStartedAt = Date.now();
    this.activeDwell = new Map();
    this.scrollEventCount = 0;
    this.maxScrollDepthPct = 0;
    this.totalScrollPx = 0;
    this.lastScrollTop = 0;
    this.observer = null;
    this.elementToKey = new Map();

    this.cardState = Object.fromEntries(
      trackedItems.map((item) => [
        item.key,
        {
          card_key: item.key,
          card_name: item.name,
          dwell_ms: 0,
          max_visible_pct: 0,
          impressions: 0,
          is_viewed: false,
          is_analysed: false,
        },
      ])
    );
  }

  start() {
    this.visitStartedAt = Date.now();
    this.registerElements();
    this.observeCards();
    this.bindScroll();
  }

  stop() {
    this.finalizeAllDwell();
    this.observer?.disconnect();
    this.observer = null;
    this.shortcutObserver?.disconnect();
    this.shortcutObserver = null;
    if (this.scrollEl) this.scrollEl.removeEventListener('scroll', this._onScroll);
    if (this.shortcutsEl) this.shortcutsEl.removeEventListener('scroll', this._onShortcutsScroll);
  }

  reset() {
    this.stop();
    this.activeDwell.clear();
    this.scrollEventCount = 0;
    this.maxScrollDepthPct = 0;
    this.totalScrollPx = 0;
    this.lastScrollTop = 0;
    this.elementToKey.clear();

    this.trackedItems.forEach((item) => {
      this.cardState[item.key] = {
        card_key: item.key,
        card_name: item.name,
        dwell_ms: 0,
        max_visible_pct: 0,
        impressions: 0,
        is_viewed: false,
        is_analysed: false,
      };
    });

    this.start();
  }

  registerElements() {
    this.trackedItems.forEach((item) => {
      item.selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          const keys = this.elementToKey.get(element) ?? [];
          if (!keys.includes(item.key)) keys.push(item.key);
          this.elementToKey.set(element, keys);
        });
      });
    });
  }

  observeCards() {
    this.observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => this.handleIntersection(entry)),
      { root: this.scrollEl, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    this.elementToKey.forEach((_keys, element) => {
      if (!element.closest('.shortcut')) this.observer.observe(element);
    });

    if (this.shortcutsEl) {
      const shortcutObserver = new IntersectionObserver(
        (entries) => entries.forEach((entry) => this.handleIntersection(entry)),
        { root: this.shortcutsEl, threshold: [0.25, 0.5, 0.75, 1] }
      );
      this.elementToKey.forEach((_keys, element) => {
        if (element.closest('.shortcut')) shortcutObserver.observe(element);
      });
      this.shortcutObserver = shortcutObserver;
    }
  }

  handleIntersection(entry) {
    const keys = this.elementToKey.get(entry.target) ?? [];
    const visiblePct = Math.round(entry.intersectionRatio * 100);

    keys.forEach((key) => {
      const state = this.cardState[key];
      state.max_visible_pct = Math.max(state.max_visible_pct, visiblePct);

      if (entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO_THRESHOLD) {
        state.is_viewed = true;
        if (!this.activeDwell.has(key)) {
          state.impressions += 1;
          this.activeDwell.set(key, Date.now());
        }
      } else if (this.activeDwell.has(key)) {
        this.finalizeDwell(key);
      }
    });
  }

  finalizeDwell(key) {
    const started = this.activeDwell.get(key);
    if (!started) return;

    const elapsed = Date.now() - started;
    if (elapsed >= DWELL_THRESHOLD_MS) {
      this.cardState[key].dwell_ms += elapsed;
      this.cardState[key].is_viewed = true;
    }
    this.activeDwell.delete(key);
  }

  finalizeAllDwell() {
    for (const key of this.activeDwell.keys()) {
      this.finalizeDwell(key);
    }
  }

  markViewed(key) {
    if (this.cardState[key]) this.cardState[key].is_viewed = true;
  }

  markAnalysed(key) {
    if (!this.cardState[key]) return;
    this.cardState[key].is_viewed = true;
    this.cardState[key].is_analysed = true;
  }

  updateScrollDepth() {
    if (!this.scrollEl) return;
    const { scrollTop, scrollHeight, clientHeight } = this.scrollEl;
    const depthPct = Math.round((scrollTop / Math.max(scrollHeight - clientHeight, 1)) * 100);
    this.maxScrollDepthPct = Math.max(this.maxScrollDepthPct, depthPct);
    this.totalScrollPx += Math.abs(scrollTop - this.lastScrollTop);
    this.lastScrollTop = scrollTop;
    this.scrollEventCount += 1;
  }

  bindScroll() {
    if (this.scrollEl) {
      this._onScroll = () => this.updateScrollDepth();
      this.scrollEl.addEventListener('scroll', this._onScroll, { passive: true });
    }

    if (this.shortcutsEl) {
      this._onShortcutsScroll = () => {
        this.elementToKey.forEach((keys, element) => {
          if (!element.closest('.shortcut')) return;
          const container = this.shortcutsEl;
          const ratio = getVisibleRatio(element, container);
          if (ratio >= VISIBLE_RATIO_THRESHOLD) {
            keys.forEach((key) => {
              this.cardState[key].is_viewed = true;
            });
          }
        });
      };
      this.shortcutsEl.addEventListener('scroll', this._onShortcutsScroll, { passive: true });
    }
  }

  buildVisitPayload(exitDestination) {
    this.finalizeAllDwell();

    const context_cards = this.trackedItems.map((item) => {
      const state = this.cardState[item.key];
      return {
        card_key: String(state.card_key),
        card_name: String(state.card_name),
        dwell_ms: Number(state.dwell_ms),
        max_visible_pct: Number(state.max_visible_pct),
        impressions: Number(state.impressions),
        is_viewed: Boolean(state.is_viewed),
        is_analysed: Boolean(state.is_analysed),
      };
    });

    const primary = [...context_cards].sort((a, b) => b.dwell_ms - a.dwell_ms)[0];

    return {
      exit_destination: String(exitDestination),
      visit_duration_ms: Number(Date.now() - this.visitStartedAt),
      scroll_max_depth_pct: Number(this.maxScrollDepthPct),
      scroll_event_count: Number(this.scrollEventCount),
      total_scroll_px: Number(Math.round(this.totalScrollPx)),
      cards_viewed_count: Number(context_cards.filter((c) => c.is_viewed).length),
      cards_analysed_count: Number(context_cards.filter((c) => c.is_analysed).length),
      primary_card_key: primary?.card_key ?? null,
      context_cards,
    };
  }
}

function getVisibleRatio(element, container) {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const overlapWidth =
    Math.min(elementRect.right, containerRect.right) -
    Math.max(elementRect.left, containerRect.left);
  const overlapHeight =
    Math.min(elementRect.bottom, containerRect.bottom) -
    Math.max(elementRect.top, containerRect.top);
  if (overlapWidth <= 0 || overlapHeight <= 0) return 0;
  const visibleArea = overlapWidth * overlapHeight;
  const elementArea = Math.max(elementRect.width * elementRect.height, 1);
  return visibleArea / elementArea;
}
