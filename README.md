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
| `Demo Viewed` | Page load |
| `Today Tab Entered` | User returns to Today |
| `Today Tab Scrolled` | User scrolls (debounced, includes depth %) |
| `Context Card Dwelling` | Card dwelled ≥2s (also in session payload) |
| **`Today Tab Card Analysis`** | **User leaves Today** — Cart Analysis payload |
| `Shortcut Tapped` | Score shortcut tapped |
| `Tab Tapped` | Bottom tab tapped |

### Cart Analysis setup

The leave-tab event sends a `context_cards` **object array** (one object per context card with dwell, visibility, taps). Enable [property splitting](https://amplitude.com/docs/analytics/charts/cart-analysis) on `context_cards` in **Amplitude Data** to analyze cards in Event Segmentation and Funnels.

Example payload:

```json
{
  "exit_tab": "Vitals",
  "session_duration_ms": 42000,
  "scroll_max_depth_pct": 78,
  "context_cards": [
    {
      "card_type": "sleep",
      "card_title": "Excellent sleep last night",
      "dwell_ms": 5200,
      "max_visible_pct": 100,
      "impressions": 2,
      "was_tapped": true,
      "tap_count": 1
    }
  ]
}
```

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
