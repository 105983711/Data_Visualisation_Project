# Road injury data story

An accessible, responsive D3 data story about hospitalised injuries from road crashes in Australia, 2011-2021.

## Run locally

The site loads a CSV file, so it must be served over HTTP rather than opened directly from the file system.

```powershell
cd website
python -m http.server 8080
```

Then open `http://localhost:8080/`.

## Structure

- `index.html` - semantic page structure and narrative
- `css/styles.css` - responsive visual design and accessibility styles
- `js/data.js` - data loading, parsing, filtering and aggregation
- `js/a11y.js` - chart metadata, keyboard interaction, tooltips and tables
- `js/charts.js` - D3 visualisation modules
- `js/app.js` - application state and controls
- `data/traffic_injury_analysis_views.csv` - KNIME export used by the charts
- `vendor/d3.v7.min.js` - local D3 7.9.0 distribution

## Accessibility

The implementation includes semantic landmarks, a skip link, visible keyboard focus, SVG titles and descriptions, keyboard-accessible marks, screen-reader announcements, text summaries, data tables, colour-independent labels and patterns, responsive text, reduced-motion support and high-contrast colours.

## AI acknowledgement

OpenAI Codex assisted with implementation under the team's direction. See `../AI_USAGE.md` and the source-code comments for the prompt summary and review responsibilities.
