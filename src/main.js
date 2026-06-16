import {
  initAnalytics,
  trackTodayTabCartAnalysisScrollStopped,
} from './analytics.js';

const appContent = document.querySelector('.app-content');
const analysisTitle = document.getElementById('analysis-title');
const analysisSubtitle = document.getElementById('analysis-subtitle');

const SCROLL_STOP_DEBOUNCE_MS = 700;

const TRACKED_ITEMS = [
  { name: 'Sleep', selectors: ['[data-card="sleep"]', '[data-feature="sleep"]'] },
  { name: 'Activity', selectors: ['[data-card="activity"]', '[data-feature="activity"]'] },
  { name: 'Daytime Stress', selectors: ['[data-card="stress"]', '[data-feature="daytime-stress"]'] },
  { name: 'Resilience', selectors: ['[data-feature="resilience"]'] },
  { name: 'Cycle Insights', selectors: ['[data-feature="cycle-insights"]'] },
  { name: 'Heart Rate', selectors: ['[data-feature="heart-rate"]', '[data-card="heart"]'] },
  { name: 'Readiness', selectors: ['[data-feature="readiness"]'] },
  { name: 'Timeline', selectors: ['.timeline'] },
];

const statusMap = Object.fromEntries(
  TRACKED_ITEMS.map((item) => [
    item.name,
    { viewed: false, analysed: false },
  ])
);

const cardKeyToItem = {
  sleep: 'Sleep',
  activity: 'Activity',
  stress: 'Daytime Stress',
  heart: 'Heart Rate',
};

const shortcutFeatureToItem = {
  readiness: 'Readiness',
  sleep: 'Sleep',
  activity: 'Activity',
  'daytime-stress': 'Daytime Stress',
  'cycle-insights': 'Cycle Insights',
  resilience: 'Resilience',
  'heart-rate': 'Heart Rate',
};

const elementToItems = new Map();
let maxScrollDepthPct = 0;
let scrollStopTimer;

function markViewed(itemName) {
  const status = statusMap[itemName];
  if (status) status.viewed = true;
}

function markAnalysed(itemName) {
  const status = statusMap[itemName];
  if (status) status.analysed = true;
}

function getCurrentScrollDepthPct() {
  if (!appContent) return 0;
  const maxScrollable = Math.max(appContent.scrollHeight - appContent.clientHeight, 1);
  return Math.round((appContent.scrollTop / maxScrollable) * 100);
}

function buildContextCardsPayload() {
  return TRACKED_ITEMS.map((item) => ({
    card_name: item.name,
    viewed: statusMap[item.name].viewed ? 'viewed' : 'not viewed',
    analysed: statusMap[item.name].analysed ? 'analysed' : 'not analysed',
  }));
}

function emitScrollStoppedEvent() {
  trackTodayTabCartAnalysisScrollStopped({
    scroll_depth_pct: maxScrollDepthPct,
    context_cards: buildContextCardsPayload(),
  });

  if (analysisTitle) analysisTitle.textContent = 'Scroll snapshot sent';
  if (analysisSubtitle) {
    analysisSubtitle.textContent = `Depth ${maxScrollDepthPct}% with Cart Analysis payload`;
  }
}

function setupVisibilityTracking() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.35) return;
        const mappedItems = elementToItems.get(entry.target) ?? [];
        mappedItems.forEach(markViewed);
      });
    },
    { root: appContent, threshold: [0.35] }
  );

  TRACKED_ITEMS.forEach((item) => {
    item.selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        const existing = elementToItems.get(el) ?? [];
        existing.push(item.name);
        elementToItems.set(el, existing);
        observer.observe(el);
      });
    });
  });
}

function setupAnalysisInteractions() {
  document.querySelectorAll('.card').forEach((card) => {
    const itemName = cardKeyToItem[card.dataset.card];
    if (!itemName) return;

    card.addEventListener('click', () => markAnalysed(itemName));
    card.querySelector('.analyze-btn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      markAnalysed(itemName);
    });
  });

  document.querySelectorAll('.shortcut').forEach((shortcut) => {
    const feature = shortcut.dataset.feature;
    const itemName = shortcutFeatureToItem[feature];
    if (!itemName) return;
    shortcut.addEventListener('click', () => markAnalysed(itemName));
  });

  document.querySelector('.timeline')?.addEventListener('click', () => {
    markAnalysed('Timeline');
  });
}

function setupScrollStopTracking() {
  if (!appContent) return;

  appContent.addEventListener(
    'scroll',
    () => {
      maxScrollDepthPct = Math.max(maxScrollDepthPct, getCurrentScrollDepthPct());
      clearTimeout(scrollStopTimer);
      scrollStopTimer = setTimeout(emitScrollStoppedEvent, SCROLL_STOP_DEBOUNCE_MS);
    },
    { passive: true }
  );
}

initAnalytics();
setupVisibilityTracking();
setupAnalysisInteractions();
setupScrollStopTracking();
