# Hospitalised Injuries from Road Crashes in Australia

COS30045 Data Visualisation — Group 28

## Team

- Mohona Tabassum Sneha
- Iqbal Sameer

## Project summary

This project analyses Australian road-crash hospitalisation data for 2011–2021. Three official BITRE workbooks were cleaned and transformed in KNIME, combined into one processed CSV, and presented through an interactive D3 dashboard. The repository also contains the final design book and presentation.

The analysis addresses six questions:

1. How did hospitalisations and corrected bed-days change over time?
2. Which road-user categories recorded the largest totals?
3. How did recorded totals differ by age group and gender?
4. How did First Nations and non-Indigenous age profiles differ?
5. How did states and territories compare?
6. What do hospitalisations and corrected bed-days reveal together?

All dashboard values are recorded counts. They are not population-adjusted rates and do not measure individual risk.

## Repository contents

```text
Data_Visualisation_Project/
├── data/
│   ├── unprocessed/   Official BITRE Excel workbooks
│   ├── processed/     KNIME-generated analytical CSV
│   └── workflow/      KNIME workflow saved with data
├── docs/
│   ├── Design_Book.docx
│   └── Group28_Final_Presentation.pdf
├── website/
│   ├── css/
│   ├── data/          Deployment copy of the processed CSV
│   ├── js/            Dashboard state, findings and chart modules
│   ├── vendor/        Local D3 library
│   ├── dashboard.html
│   └── index.html
├── AI_USAGE.md
└── README.md
```

## Data sources

The unprocessed data in `data/unprocessed/` contains the three BITRE workbooks used in the project:

- `hospitalisation_injury_publication_sep2023.xlsx` — national hospitalisation data;
- `state-and-territory-hospitalisation-injury-publication-2023.xlsx` — state and territory data; and
- `First-Nations-hospitalised-injuries-2023.xlsx` — First Nations status and age-group data.

The data was obtained from the [BITRE Hospitalised Injury collection](https://www.bitre.gov.au/resource/road-safety/hospitalised-injury). The analysis uses the raw sheets rather than copying the preformatted summary tables, allowing the filtering, cleaning and aggregation to be reproduced.

## KNIME processing

The saved workflow is `data/workflow/Group28.knwf`. It includes its data and can be opened in KNIME Analytics Platform.

The workflow:

- reads and inspects the three official workbooks;
- filters the national file to traffic-injury records;
- cleans category labels and checks missing values, duplicates and distributions;
- creates month, date and ordering fields;
- validates the published hospitalisation relationship;
- calculates corrected bed-days as `Bed days - Died_bed_days`;
- preserves published `n.p.` values as missing instead of replacing them with zero;
- derives five analytical views for the dashboard;
- concatenates the views and verifies their row counts; and
- exports one chart-ready CSV.

The processed file is `data/processed/traffic_injury_analysis_views.csv`. It contains 869 rows across five labelled views:

| Analytical view | Rows | Dashboard use |
|---|---:|---|
| National Monthly | 132 | Annual trend |
| National Road User | 132 | Road-user composition |
| National Age and Sex | 165 | Age and gender comparison |
| State Six-Monthly | 176 | State ranking and heatmap |
| First Nations Age Group | 264 | First Nations age profiles |
| **Total** | **869** | Six coordinated visualisations |

A copy of the same CSV is stored in `website/data/` so the dashboard can run as a self-contained website.

## Dashboard

The dashboard is implemented with HTML, CSS, JavaScript and D3. It uses five navigation tabs:

- **Overview** — enlarged annual trend and road-user composition charts with direct measure labels and readable annotations;
- **People** — age-and-gender grouped bars and a First Nations dumbbell plot;
- **Places** — state and territory ranking and a state-by-year heatmap;
- **Findings** — hospitalisations and corrected bed-days shown side by side for all six questions; and
- **Definitions** — measure definitions, processing notes and interpretation limits.

Shared controls let users choose hospitalisations or corrected bed-days, select start and end years, and reset the dashboard. The charts update from the same dashboard state. Tooltips, direct labels, keyboard-operable marks, visible focus, SVG descriptions, an `aria-live` status message and reduced-motion support improve accessibility.

The chart choices match the analytical tasks:

| Question | Chart | Reason |
|---|---|---|
| Change over time | Line and area chart | Year is ordered and the chart reveals direction and the peak. |
| Road-user composition | Donut chart | Summarises the leading categories as parts of the selected total. |
| Age and gender | Grouped bars | A common baseline supports direct comparison. |
| First Nations profiles | Dumbbell plot | Shows the gap between two within-status shares for each age group. |
| State comparison | Horizontal ranking | Supports accurate comparison of jurisdiction totals. |
| State patterns over time | Heatmap | Reveals strong state-and-year combinations in a compact matrix. |

## Validation and usability evaluation

KNIME validation included Statistics, Value Counter, Histogram, Duplicate Row Filter, Formula Error checks and final view-count verification. No rows failed the hospitalisation formula check, and all five expected analytical views were present before export.

A formative usability evaluation was completed with three classmates. Tasks covered navigation, filters, the peak year, leading road-user category, corrected bed-days, age and gender, First Nations profiles, state comparisons and the counts-not-risk warning. The observations led to larger chart text and legends, direct Hospitalisations or Bed-days labels beneath each chart, separated trend annotations and removal of the Overview summary-card row so the charts had more space. The measure explanations and interpretation limits remain prominent.

## Design book and presentation

- `docs/Design_Book.docx` documents the research questions, source data, KNIME processing, visual design decisions, dashboard implementation, validation, usability evaluation and appendices.
- `docs/Group28_Final_Presentation.pdf` presents the project process, findings, chart stories and design justification.

## Run the dashboard locally

The CSV must be loaded through HTTP rather than by opening the HTML file directly.

```powershell
cd website
python -m http.server 8080
```

Open `http://localhost:8080/`. The entry page redirects to `dashboard.html`.

## Main website files

- `website/dashboard.html` — dashboard structure and written context
- `website/css/dashboard.css` — layout, visual design and responsive rules
- `website/js/dashboard.js` — shared state, filters, navigation and rendering
- `website/js/findings.js` — two-measure findings table
- `website/js/data.js` — CSV parsing, filtering and D3 aggregation
- `website/js/a11y.js` — tooltips and accessible mark behaviour
- `website/js/charts/` — one module for each visualisation
- `website/vendor/d3.v7.min.js` — local D3 library

Generative AI use is declared separately in `AI_USAGE.md`.
