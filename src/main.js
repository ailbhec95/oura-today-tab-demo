import { initAnalytics, trackTodayTabVisitEnded } from './analytics.js';
import { TodayTabVisitTracker } from './todayVisit.js';

const appContent = document.querySelector('.app-content');
const shortcutsEl = document.querySelector('.shortcuts');
const tabBar = document.querySelector('.tab-bar');
const analysisTitle = document.getElementById('analysis-title');
const analysisSubtitle = document.getElementById('analysis-subtitle');
const analysisEmpty = document.getElementById('analysis-empty');
const analysisContent = document.getElementById('analysis-content');

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

let activeTab = 'Today';

const visitTracker = new TodayTabVisitTracker({
  scrollContainer: appContent,
  shortcutsContainer: shortcutsEl,
  trackedItems: TRACKED_ITEMS,
});

function showVisitPayload(payload) {
  if (!analysisEmpty || !analysisContent) return;

  analysisTitle.textContent = 'Visit summary sent';
  analysisSubtitle.textContent = `One event · ${payload.visit_duration_ms}ms on Today`;
  analysisEmpty.hidden = true;
  analysisContent.hidden = false;
  analysisContent.innerHTML = `
    <div class="analysis-section">
      <h4>Event: Today Tab Visit Ended</h4>
      <pre style="font-size:11px;line-height:1.45;white-space:pre-wrap;word-break:break-word;color:var(--text-secondary);background:var(--surface-elevated);padding:12px;border-radius:8px;border:1px solid var(--border);">${JSON.stringify(payload, null, 2)}</pre>
    </div>
    <div class="analysis-section">
      <h4>What was captured</h4>
      <ul>
        <li><code>card_dwell</code> — object array for avg dwell per card (Cart Analysis)</li>
        <li><code>cards_viewed</code> / <code>cards_analysed</code> — string arrays for filters</li>
        <li>Scroll depth, scroll count, pixels scrolled</li>
      </ul>
    </div>
  `;
}

function endTodayVisit(exitDestination) {
  const payload = visitTracker.buildVisitPayload(exitDestination);
  trackTodayTabVisitEnded(payload);
  showVisitPayload(payload);
}

function resetAnalysisPanel() {
  analysisTitle.textContent = 'Browse the Today tab';
  analysisSubtitle.textContent = 'One analytics event fires when you leave Today';
  analysisEmpty.hidden = false;
  analysisContent.hidden = true;
}

function switchTab(tabName) {
  if (tabName === activeTab) return;

  tabBar.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  if (activeTab === 'Today' && tabName !== 'Today') {
    endTodayVisit(tabName);
  }

  if (tabName === 'Today') {
    visitTracker.reset();
    resetAnalysisPanel();
  }

  activeTab = tabName;
}

function bindInteractions() {
  document.querySelectorAll('.card').forEach((card) => {
    const itemKey = cardKeyToItemKey[card.dataset.card];
    if (!itemKey) return;

    const markAnalysed = () => {
      visitTracker.markViewed(itemKey);
      visitTracker.markAnalysed(itemKey);
    };

    card.addEventListener('click', markAnalysed);
    card.querySelector('.analyze-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      markAnalysed();
    });
  });

  document.querySelectorAll('.shortcut').forEach((shortcut) => {
    const itemKey = shortcutFeatureToItemKey[shortcut.dataset.feature];
    if (!itemKey) return;
    shortcut.addEventListener('click', () => {
      visitTracker.markViewed(itemKey);
      visitTracker.markAnalysed(itemKey);
    });
  });

  document.querySelector('.timeline')?.addEventListener('click', () => {
    visitTracker.markViewed('timeline');
    visitTracker.markAnalysed('timeline');
  });

  tabBar.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

initAnalytics();
visitTracker.start();
bindInteractions();
resetAnalysisPanel();
