import {
  initAnalytics,
  trackDemoViewed,
  trackCardSelected,
  trackCardAnalyzeClicked,
  trackCardAnalysisStarted,
  trackCardAnalysisCompleted,
  trackShortcutTapped,
  trackTabTapped,
} from './analytics.js';

const analyses = {
  sleep: {
    title: 'Excellent sleep last night',
    subtitle: 'Sleep card · Analyzed just now',
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
    subtitle: 'Activity card · Analyzed just now',
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
    subtitle: 'Stress card · Analyzed just now',
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
    subtitle: 'Heart health card · Analyzed just now',
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
};

const cards = document.querySelectorAll('.card');
const panelTitle = document.getElementById('analysis-title');
const panelSubtitle = document.getElementById('analysis-subtitle');
const analysisEmpty = document.getElementById('analysis-empty');
const analysisContent = document.getElementById('analysis-content');

function renderAnalysis(key) {
  const data = analyses[key];
  if (!data) return;

  cards.forEach((c) => c.classList.toggle('selected', c.dataset.card === key));

  panelTitle.textContent = data.title;
  panelSubtitle.textContent = data.subtitle;
  analysisEmpty.hidden = true;
  analysisContent.hidden = false;

  analysisContent.innerHTML = `
    <div class="analysis-section">
      <h4>Summary</h4>
      <p>${data.summary}</p>
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

  trackCardAnalysisCompleted(key, data.confidence);
}

function showLoading(key) {
  cards.forEach((c) => c.classList.toggle('selected', c.dataset.card === key));
  panelTitle.textContent = 'Analyzing…';
  panelSubtitle.textContent = 'Processing card data';
  analysisEmpty.hidden = true;
  analysisContent.hidden = false;
  analysisContent.innerHTML = `
    <div class="analysis-section" style="text-align:center;padding:40px 0">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <p style="margin-top:16px;color:var(--text-tertiary);font-size:14px">Extracting metrics and generating insights</p>
    </div>
  `;
}

function analyzeCard(key, source = 'card_click') {
  trackCardAnalysisStarted(key);
  if (source === 'analyze_button') {
    trackCardAnalyzeClicked(key);
  } else {
    trackCardSelected(key, source);
  }
  showLoading(key);
  setTimeout(() => renderAnalysis(key), 900);
}

function bindInteractions() {
  cards.forEach((card) => {
    const key = card.dataset.card;

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('analyze-btn')) return;
      analyzeCard(key, 'card_click');
    });

    card.querySelector('.analyze-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      analyzeCard(key, 'analyze_button');
    });
  });

  document.querySelectorAll('.shortcut').forEach((shortcut) => {
    shortcut.addEventListener('click', () => {
      const label = shortcut.querySelector('.shortcut-label')?.textContent ?? 'unknown';
      const score = shortcut.querySelector('.score-num')?.textContent ?? '';
      trackShortcutTapped(label, score);
    });
  });

  document.querySelectorAll('.tab-bar .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.textContent?.trim() ?? 'unknown';
      trackTabTapped(tabName);
    });
  });
}

initAnalytics();
trackDemoViewed();
bindInteractions();

// Auto-demo: analyze sleep card on load
setTimeout(() => analyzeCard('sleep', 'auto_demo'), 1200);
