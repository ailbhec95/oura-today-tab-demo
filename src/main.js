import {
  initAnalytics,
  trackDemoViewed,
  trackTodayTabCardAnalysis,
  trackTodayTabScrolled,
  trackContextCardDwelling,
  trackShortcutTapped,
  trackTabTapped,
  trackTodayTabEntered,
} from './analytics.js';
import { TodayTabSessionTracker } from './todaySession.js';

const analyses = {
  sleep: {
    title: 'Excellent sleep last night',
    subtitle: 'Sleep card · Session analysis',
    summary:
      "Last night's sleep was in your top 15% over the past 90 days. Deep sleep duration and low resting heart rate indicate strong parasympathetic recovery, which directly supports today's Readiness score of 82.",
    metrics: [
      { label: 'Sleep score', value: '88' },
      { label: 'Deep sleep', value: '2h 18m (+22 min vs avg)' },
      { label: 'Resting HR', value: '52 bpm' },
      { label: 'Efficiency', value: '94%' },
    ],
    insights: [
      'Bedtime consistency (10:42 PM) aligned with your optimal window',
      'REM sleep was slightly below average — monitor if pattern persists 3+ nights',
      'Temperature deviation was minimal, suggesting good thermoregulation',
    ],
    recommendation:
      'Maintain your current evening routine. If you train today, afternoon is optimal given HRV and readiness signals.',
    confidence: 91,
  },
  activity: {
    title: 'Activity goal within reach',
    subtitle: 'Activity card · Session analysis',
    summary:
      "You're at 71% of your daily step goal by mid-morning, which is ahead of your typical Tuesday pace. Readiness is high, so adding a focused activity block this afternoon would be well-tolerated without compromising recovery.",
    metrics: [
      { label: 'Steps', value: '4,280 / 6,000' },
      { label: 'Active calories', value: '320 kcal' },
      { label: 'Activity score', value: '62 (room to grow)' },
      { label: 'Readiness', value: '82' },
    ],
    insights: [
      'Morning walk contributed 1,240 steps — good low-intensity baseline',
      'Sedentary period 10:00–11:30 AM is longer than your weekday average',
      'Goal completion probability today: ~87% at current trajectory',
    ],
    recommendation:
      'A 25–35 minute moderate walk or workout between 2–4 PM would close the gap while aligning with peak readiness.',
    confidence: 84,
  },
  stress: {
    title: 'Daytime stress is low',
    subtitle: 'Stress card · Session analysis',
    summary:
      'Overall daytime stress load is in the "restored" zone. The commute-related peak at 9:30 AM was acute and short-lived — recovery within 45 minutes suggests healthy autonomic flexibility.',
    metrics: [
      { label: 'Stress status', value: 'Restored' },
      { label: 'Peak load', value: '9:30 AM (commute)' },
      { label: 'Recovery time', value: '~45 min' },
      { label: 'Day avg vs baseline', value: '-12%' },
    ],
    insights: [
      'Stress spike correlated with detected movement pattern (driving/transit)',
      'Post-peak HRV rebound was faster than your 30-day average',
      'No sustained elevated stress periods detected since 10:15 AM',
    ],
    recommendation:
      'No intervention needed. If afternoon meetings stack up, a 5-minute breathing break before 3 PM could preserve the restored state.',
    confidence: 88,
  },
  heart: {
    title: 'HRV trending up',
    subtitle: 'Heart health card · Session analysis',
    summary:
      'Overnight HRV of 42 ms is meaningfully above your 14-day rolling baseline (+8%). This trend, combined with strong sleep metrics, indicates improving cardiovascular recovery capacity.',
    metrics: [
      { label: 'HRV (avg)', value: '42 ms' },
      { label: 'vs baseline', value: '+8%' },
      { label: 'RHR', value: '52 bpm' },
      { label: 'Readiness contrib.', value: 'Positive' },
    ],
    insights: [
      'HRV has increased 3 of the last 5 nights — emerging positive trend',
      'Correlation with deep sleep minutes is strong (r ≈ 0.72 in your data)',
      'No signs of overtraining or illness-related suppression',
    ],
    recommendation:
      'This is a good window for slightly higher training load if activity goals warrant it. Continue monitoring for 2–3 more days to confirm trend.',
    confidence: 86,
  },
  daily_highlight: {
    title: "Strong recovery — you're ready to perform",
    subtitle: 'Daily highlight · Session analysis',
    summary:
      'Your daily highlight received meaningful attention this session. Sleep quality and HRV are above your 14-day baseline, supporting a high-readiness day.',
    metrics: [
      { label: 'Readiness', value: '82' },
      { label: 'Sleep score', value: '88' },
      { label: 'HRV trend', value: '+8% vs baseline' },
    ],
    insights: [
      'Highlight aligned with top-performing metrics in your session',
      'Consider moderate activity while readiness remains elevated',
    ],
    recommendation:
      'Afternoon is an optimal window for training based on combined readiness signals.',
    confidence: 89,
  },
};

const cards = document.querySelectorAll('.card');
const panelTitle = document.getElementById('analysis-title');
const panelSubtitle = document.getElementById('analysis-subtitle');
const analysisEmpty = document.getElementById('analysis-empty');
const analysisContent = document.getElementById('analysis-content');
const appContent = document.querySelector('.app-content');
const tabBar = document.querySelector('.tab-bar');
const phoneScreen = document.querySelector('.phone');

let activeTab = 'Today';
const reportedDwellKeys = new Set();

const sessionTracker = new TodayTabSessionTracker({
  scrollContainer: appContent,
  cardSelector: '.card, .daily-highlight',
});

sessionTracker.onScrollDepth = (scrollProps) => {
  trackTodayTabScrolled(scrollProps);
};

function renderSessionAnalysis(session) {
  const primaryKey = session.primary_card_type ?? session.context_cards[0]?.card_type;
  const data = analyses[primaryKey];

  if (!data) {
    panelTitle.textContent = 'Session complete';
    panelSubtitle.textContent = `Left Today for ${session.exit_tab}`;
    analysisEmpty.hidden = true;
    analysisContent.hidden = false;
    analysisContent.innerHTML = `
      <div class="analysis-section">
        <h4>Session summary</h4>
        <p>Tracked ${session.cards_viewed_count} context cards over ${Math.round(session.session_duration_ms / 1000)}s with ${session.scroll_max_depth_pct}% max scroll depth.</p>
      </div>
    `;
    return;
  }

  cards.forEach((c) => c.classList.toggle('selected', c.dataset.card === primaryKey));

  const primaryCard = session.context_cards.find((c) => c.card_type === primaryKey);
  const dwellSec = primaryCard ? (primaryCard.dwell_ms / 1000).toFixed(1) : '—';

  panelTitle.textContent = data.title;
  panelSubtitle.textContent = `${data.subtitle} · Left for ${session.exit_tab}`;
  analysisEmpty.hidden = true;
  analysisContent.hidden = false;

  analysisContent.innerHTML = `
    <div class="analysis-section">
      <h4>Summary</h4>
      <p>${data.summary}</p>
    </div>
    <div class="analysis-section">
      <h4>Session signals (Cart Analysis)</h4>
      <div class="metric-chips">
        <span class="metric-chip"><strong>Dwell:</strong> ${dwellSec}s on primary card</span>
        <span class="metric-chip"><strong>Scroll depth:</strong> ${session.scroll_max_depth_pct}%</span>
        <span class="metric-chip"><strong>Cards viewed:</strong> ${session.cards_viewed_count}</span>
        <span class="metric-chip"><strong>Scroll events:</strong> ${session.scroll_event_count}</span>
      </div>
    </div>
    <div class="analysis-section">
      <h4>Context cards in session</h4>
      <ul>
        ${session.context_cards
          .map(
            (c) =>
              `<li><strong>${c.card_title}</strong> — ${(c.dwell_ms / 1000).toFixed(1)}s dwell, ${c.max_visible_pct}% visible${c.was_tapped ? ', tapped' : ''}</li>`
          )
          .join('')}
      </ul>
    </div>
    <div class="analysis-section">
      <h4>Contributing metrics</h4>
      <div class="metric-chips">
        ${data.metrics.map((m) => `<span class="metric-chip"><strong>${m.label}:</strong> ${m.value}</span>`).join('')}
      </div>
    </div>
    <div class="analysis-section">
      <h4>Key insights</h4>
      <ul>${data.insights.map((i) => `<li>${i}</li>`).join('')}</ul>
    </div>
    <div class="analysis-section">
      <h4>Recommendation</h4>
      <p>${data.recommendation}</p>
    </div>
    <div class="analysis-section">
      <h4>Analysis confidence</h4>
      <div class="confidence-bar"><div class="confidence-fill" style="width: 0%"></div></div>
      <div class="confidence-label">
        <span>Model confidence</span>
        <span>${data.confidence}%</span>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    const fill = analysisContent.querySelector('.confidence-fill');
    if (fill) fill.style.width = `${data.confidence}%`;
  });
}

function showLoadingAnalysis() {
  panelTitle.textContent = 'Analyzing session…';
  panelSubtitle.textContent = 'Processing dwell & scroll from Today tab';
  analysisEmpty.hidden = true;
  analysisContent.hidden = false;
  analysisContent.innerHTML = `
    <div class="analysis-section" style="text-align:center;padding:40px 0">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <p style="margin-top:16px;color:var(--text-tertiary);font-size:14px">Building Cart Analysis payload from context cards</p>
    </div>
  `;
}

function leaveTodayTab(exitTab) {
  showLoadingAnalysis();

  const session = sessionTracker.flush(exitTab);
  trackTodayTabCardAnalysis(session);

  session.context_cards.forEach((card) => {
    const key = `${card.card_type}:${card.dwell_ms}`;
    if (card.dwell_ms >= 2000 && !reportedDwellKeys.has(key)) {
      reportedDwellKeys.add(key);
      trackContextCardDwelling({
        card_type: card.card_type,
        card_title: card.card_title,
        dwell_ms: card.dwell_ms,
        max_visible_pct: card.max_visible_pct,
      });
    }
  });

  setTimeout(() => renderSessionAnalysis(session), 900);
}

function switchTab(tabName) {
  const fromTab = activeTab;
  if (tabName === fromTab) return;

  tabBar.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  if (fromTab === 'Today' && tabName !== 'Today') {
    leaveTodayTab(tabName);
    phoneScreen?.classList.add('tab-away-from-today');
  }

  if (tabName === 'Today') {
    phoneScreen?.classList.remove('tab-away-from-today');
    sessionTracker.reset();
    trackTodayTabEntered();
    resetAnalysisPanel();
  }

  activeTab = tabName;
  trackTabTapped(tabName, fromTab);
}

function resetAnalysisPanel() {
  cards.forEach((c) => c.classList.remove('selected'));
  panelTitle.textContent = 'Browse the Today tab';
  panelSubtitle.textContent = 'Card analysis runs when you leave Today';
  analysisEmpty.hidden = false;
  analysisContent.hidden = true;
}

function bindInteractions() {
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      sessionTracker.recordCardTap(card);
      cards.forEach((c) => c.classList.toggle('selected', c === card));
    });
  });

  document.querySelectorAll('.shortcut').forEach((shortcut) => {
    shortcut.addEventListener('click', () => {
      const label = shortcut.querySelector('.shortcut-label')?.textContent ?? 'unknown';
      const score = shortcut.querySelector('.score-num')?.textContent ?? '';
      trackShortcutTapped(label, score);
    });
  });

  tabBar.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

initAnalytics();
trackDemoViewed();
sessionTracker.start();
trackTodayTabEntered();
bindInteractions();
resetAnalysisPanel();
