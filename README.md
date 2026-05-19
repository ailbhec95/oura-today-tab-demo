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
| `Card Selected` | User taps a card |
| `Card Analyze Clicked` | User taps **Analyze** |
| `Card Analysis Started` | Analysis begins |
| `Card Analysis Completed` | Analysis finishes (includes `confidence_score`) |
| `Shortcut Tapped` | Score shortcut tapped |
| `Tab Tapped` | Bottom tab tapped |

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
