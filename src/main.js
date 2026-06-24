import { initAnalytics, trackTodayTabScrollStopped } from './analytics.js';

const appContent = document.querySelector('.app-content');
const shortcutsEl = document.querySelector('.shortcuts');
const analysisTitle = document.getElementById('analysis-title');
const analysisSubtitle = document.getElementById('analysis-subtitle');
const analysisEmpty = document.getElementById('analysis-empty');
const analysisContent = document.getElementById('analysis-content');

const SCROLL_STOP_DEBOUNCE_MS = 700;
const VISIBLE_RATIO_THRESHOLD = 0.25;

// Fixed card catalog — every event always sends all 8 rows (required for Cart Analysis typing).
const TRACKED_ITEMS = [
  { key: 'sleep', name: 'Sleep', selectors: ['[data-card="sleep"]', '[data-feature="sleep"]'] },
  { key: 'activity', name: 'Activity', selectors: ['[data-card="activity"]', '[data-feature="activity"]'] },
  { key: 'daytime_stress', name: 'Daytime Stress', selectors: ['[data-card="stress"]', '[data-feature="daytime-stress"]'] },
  { key: 'resilience', name: 'Resilience', selectors: ['[data-feature="resilience"]'] },
  { key: 'cycle_insights', name: 'Cycle Insights', selectors: ['[data-feature="cycle-insights"]'] },
  { key: 'heart_rate', name: 'Heart Rate', selectors: ['[data-feature="heart-rate"]', '[data-card="heart"]'] },
  { key: 'readiness', name: 'Readiness', selectors: ['[data-feature="readiness"]'] },
  { key: 'timeline', name: 'Timeline', selectors: ['.timeline'] },
];

const statusMap = Object.fromEntries(
  TRACKED_ITEMS.map((item) => [item.key, { viewed: false, analysed: false }])
);

const trackedElements = [];

const cardKeyToItemKey = {
  sleep: 'sleep',
  activity: 'activity',
  stress: 'daytime_stress',
  heart: 'heart_rate',
};

const shortcutFeatureToItemKey = {
  readiness: 'readiness',
  sleep: 'sleep',
  activity: 'activity',
  'daytime-stress': 'daytime_stress',
  'cycle-insights': 'cycle_insights',
  resilience: 'resilience',
  'heart-rate': 'heart_rate',
};

let maxScrollDepthPct = 0;
let scrollStopTimer;

function markViewed(itemKey) {
  const status = statusMap[itemKey];
  if (status) status.viewed = true;
}

function markAnalysed(itemKey) {
  const status = statusMap[itemKey];
  if (status) status.analysed = true;
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

function getVisibilityContainer(element) {
  if (element.closest('.shortcut')) return shortcutsEl ?? appContent;
  return appContent;
}

function refreshViewedState() {
  trackedElements.forEach(({ element, itemKey }) => {
    const container = getVisibilityContainer(element);
    if (!container) return;

    const ratio = getVisibleRatio(element, container);
    if (ratio >= VISIBLE_RATIO_THRESHOLD) {
      markViewed(itemKey);
    }
  });
}

function getCurrentScrollDepthPct() {
  if (!appContent) return 0;
  const maxScrollable = Math.max(appContent.scrollHeight - appContent.clientHeight, 1);
  return Math.round((appContent.scrollTop / maxScrollable) * 100);
}

function buildCartPayload() {
  return {
    scroll_depth_pct: Number(maxScrollDepthPct),
    today_tab_cards: TRACKED_ITEMS.map((item) => {
      const status = statusMap[item.key];
      return {
        card_key: String(item.key),
        card_name: String(item.name),
        is_viewed: Boolean(status.viewed),
        is_analysed: Boolean(status.analysed),
      };
    }),
  };
}

function showLastPayload(payload) {
  if (!analysisEmpty || !analysisContent) return;

  analysisTitle.textContent = 'Cart Analysis payload sent';
  analysisSubtitle.textContent = 'One event · 8 cards · fixed schema';
  analysisEmpty.hidden = true;
  analysisContent.hidden = false;
  analysisContent.innerHTML = `
    <div class="analysis-section">
      <h4>Event: Today Tab Scroll Stopped</h4>
      <pre style="font-size:11px;line-height:1.45;white-space:pre-wrap;word-break:break-word;color:var(--text-secondary);background:var(--surface-elevated);padding:12px;border-radius:8px;border:1px solid var(--border);">${JSON.stringify(payload, null, 2)}</pre>
    </div>
    <div class="analysis-section">
      <h4>Filter per card in Amplitude</h4>
      <p>Use <strong>parallel filters</strong> on the same event:</p>
      <ul>
        <li><code>today_tab_cards {:}.card_key</code> = <code>sleep</code></li>
        <li><code>today_tab_cards {:}.is_viewed</code> is <code>true</code></li>
        <li><code>today_tab_cards {:}.is_analysed</code> is <code>true</code></li>
      </ul>
      <p>Group by <code>today_tab_cards {:}.card_name</code> to compare all cards.</p>
    </div>
  `;
}

function emitScrollStoppedEvent() {
  refreshViewedState();

  const payload = buildCartPayload();
  trackTodayTabScrollStopped(payload);
  showLastPayload(payload);
}

function scheduleScrollStoppedEvent() {
  clearTimeout(scrollStopTimer);
  scrollStopTimer = setTimeout(emitScrollStoppedEvent, SCROLL_STOP_DEBOUNCE_MS);
}

function registerTrackedElements() {
  TRACKED_ITEMS.forEach((item) => {
    item.selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        trackedElements.push({ element, itemKey: item.key });
      });
    });
  });
}

function setupAnalysisInteractions() {
  document.querySelectorAll('.card').forEach((card) => {
    const itemKey = cardKeyToItemKey[card.dataset.card];
    if (!itemKey) return;

    const markCardAnalysed = () => {
      markViewed(itemKey);
      markAnalysed(itemKey);
    };

    card.addEventListener('click', markCardAnalysed);
    card.querySelector('.analyze-btn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      markCardAnalysed();
    });
  });

  document.querySelectorAll('.shortcut').forEach((shortcut) => {
    const feature = shortcut.dataset.feature;
    const itemKey = shortcutFeatureToItemKey[feature];
    if (!itemKey) return;

    shortcut.addEventListener('click', () => {
      markViewed(itemKey);
      markAnalysed(itemKey);
    });
  });

  document.querySelector('.timeline')?.addEventListener('click', () => {
    markViewed('timeline');
    markAnalysed('timeline');
  });
}

function setupScrollStopTracking() {
  if (appContent) {
    appContent.addEventListener(
      'scroll',
      () => {
        maxScrollDepthPct = Math.max(maxScrollDepthPct, getCurrentScrollDepthPct());
        scheduleScrollStoppedEvent();
      },
      { passive: true }
    );
  }

  if (shortcutsEl) {
    shortcutsEl.addEventListener(
      'scroll',
      () => {
        refreshViewedState();
        scheduleScrollStoppedEvent();
      },
      { passive: true }
    );
  }
}

initAnalytics();
registerTrackedElements();
setupAnalysisInteractions();
setupScrollStopTracking();
requestAnimationFrame(refreshViewedState);
