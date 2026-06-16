import {
  initAnalytics,
  trackTodayTabCartAnalysisScrollStopped,
} from './analytics.js';

const appContent = document.querySelector('.app-content');
const shortcutsEl = document.querySelector('.shortcuts');
const analysisTitle = document.getElementById('analysis-title');
const analysisSubtitle = document.getElementById('analysis-subtitle');

const SCROLL_STOP_DEBOUNCE_MS = 700;
const VISIBLE_RATIO_THRESHOLD = 0.25;

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
  TRACKED_ITEMS.map((item) => [item.name, { viewed: false, analysed: false }])
);

const trackedElements = [];

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
  trackedElements.forEach(({ element, itemName }) => {
    const container = getVisibilityContainer(element);
    if (!container) return;

    const ratio = getVisibleRatio(element, container);
    if (ratio >= VISIBLE_RATIO_THRESHOLD) {
      markViewed(itemName);
    }
  });
}

function getCurrentScrollDepthPct() {
  if (!appContent) return 0;
  const maxScrollable = Math.max(appContent.scrollHeight - appContent.clientHeight, 1);
  return Math.round((appContent.scrollTop / maxScrollable) * 100);
}

function buildCartObjectArray() {
  return {
    context_cards: TRACKED_ITEMS.map((item) => ({
      name: item.name,
      viewed: statusMap[item.name].viewed ? 'viewed' : 'not viewed',
      analysed: statusMap[item.name].analysed ? 'analysed' : 'not analysed',
    })),
    scroll_depth_pct: maxScrollDepthPct,
  };
}

function emitScrollStoppedEvent() {
  refreshViewedState();

  trackTodayTabCartAnalysisScrollStopped(buildCartObjectArray());

  if (analysisTitle) analysisTitle.textContent = 'Scroll snapshot sent';
  if (analysisSubtitle) {
    analysisSubtitle.textContent = `Depth ${maxScrollDepthPct}% with Cart Analysis payload`;
  }
}

function scheduleScrollStoppedEvent() {
  clearTimeout(scrollStopTimer);
  scrollStopTimer = setTimeout(emitScrollStoppedEvent, SCROLL_STOP_DEBOUNCE_MS);
}

function registerTrackedElements() {
  TRACKED_ITEMS.forEach((item) => {
    item.selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        trackedElements.push({ element, itemName: item.name });
      });
    });
  });
}

function setupAnalysisInteractions() {
  document.querySelectorAll('.card').forEach((card) => {
    const itemName = cardKeyToItem[card.dataset.card];
    if (!itemName) return;

    const markCardAnalysed = () => {
      markViewed(itemName);
      markAnalysed(itemName);
    };

    card.addEventListener('click', markCardAnalysed);
    card.querySelector('.analyze-btn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      markCardAnalysed();
    });
  });

  document.querySelectorAll('.shortcut').forEach((shortcut) => {
    const feature = shortcut.dataset.feature;
    const itemName = shortcutFeatureToItem[feature];
    if (!itemName) return;

    shortcut.addEventListener('click', () => {
      markViewed(itemName);
      markAnalysed(itemName);
    });
  });

  document.querySelector('.timeline')?.addEventListener('click', () => {
    markViewed('Timeline');
    markAnalysed('Timeline');
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
