# Oura Today Tab Demo

Interactive mock of the Oura app **Today** tab with card analysis, instrumented with [Amplitude Browser SDK 0.2](https://www.npmjs.com/package/@amplitude/analytics-browser/v/0.2.4).

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Live demo

**https://ailbhec95.github.io/oura-today-tab-demo/**

Deployed automatically from `main` via GitHub Pages.

## Amplitude events

| Event | When |
|-------|------|
| **`Today Tab Visit Ended`** | **User leaves Today** — one event per visit |

### Payload shape

```json
{
  "exit_destination": "Vitals",
  "visit_duration_ms": 42000,
  "scroll_max_depth_pct": 78,
  "scroll_event_count": 12,
  "total_scroll_px": 420,
  "cards_viewed": ["sleep", "activity", "readiness"],
  "cards_analysed": ["sleep"],
  "cards_viewed_count": 3,
  "cards_analysed_count": 1,
  "primary_card_key": "sleep",
  "card_dwell": [
    { "card_key": "sleep", "dwell_ms": 5200 },
    { "card_key": "activity", "dwell_ms": 1200 }
  ]
}
```

- **`cards_viewed` / `cards_analysed`** — string arrays; filter with **contains** (e.g. viewed Sleep but didn't analyse).
- **`card_dwell`** — object array; only cards with meaningful dwell (`> 0`). Enable [property splitting](https://amplitude.com/docs/analytics/charts/cart-analysis) on `card_dwell` in **Amplitude Data**, then group by `card_dwell {:}.card_key` and average `card_dwell {:}.dwell_ms` for avg dwell per card.

## Configuration

Copy `.env.example` to `.env` and set your Amplitude API key:

```
VITE_AMPLITUDE_API_KEY=your_key_here
```

## Build

```bash
npm run build
npm run preview
```
