# Hospitalised Injuries from Road Crashes in Australia

COS30045 Data Visualisation — Group 28

## Team

- Mohona Tabassum Sneha
- Iqbal Sameer

## Project overview

This project examines hospitalised injuries from road crashes in Australia between 2011 and 2021. The KNIME workflow prepares the source data and the D3 website presents a guided, interactive data story.

The project investigates:

- how hospitalisations and hospital bed-days changed over time;
- which road-user categories recorded the highest totals;
- how hospitalisations differed by age group and sex;
- how recorded totals varied across states and territories; and
- how age profiles differed between First Nations people and non-Indigenous Australians.

The values are absolute counts. They are not adjusted for population size, travel exposure or individual risk.

## Data sources

Three official Excel workbooks were downloaded from the [BITRE Hospitalised Injury page](https://www.bitre.gov.au/resource/road-safety/hospitalised-injury):

1. `hospitalisation_injury_publication_sep2023.xlsx` — national hospitalisation records;
2. `state-and-territory-hospitalisation-injury-publication-2023.xlsx` — state and territory records; and
3. `First-Nations-hospitalised-injuries-2023.xlsx` — First Nations status and age-group records.

The release covers 2011–2021 and was published on 22 September 2023. The source workbooks and BITRE data dictionary are included inside the exported KNIME workflow package.

The workflow reads the `raw` sheet from each workbook rather than relying on the formatted summary tables. This allowed us to perform our own filtering, cleaning, checks and aggregations.

## KNIME processing

The KNIME workflow:

- reads the three official workbooks;
- keeps traffic-injury records from the national data;
- cleans category labels and whitespace;
- checks category values, missing values, duplicates and numeric distributions;
- validates the published hospitalisation calculation;
- creates month, date and age-order fields for correct sorting;
- groups the national data into monthly, road-user, and age-and-sex views;
- prepares the state and First Nations views;
- labels and concatenates the five views;
- checks that every expected view is present; and
- writes one chart-ready CSV file.

The exported `bed_days` field represents bed-days excluding bed-days associated with people who died in hospital within 30 days. Published `n.p.` values remain unavailable and are not changed to zero.

The exported workflow is stored at `data/workflow/Group28.knwf`. A detailed explanation of its nodes and branches is available at `docs/storyboard/knime-workflow-explanation.md`.

## Processed data

The processed file is `data/processed/traffic_injury_analysis_views.csv`. It contains 869 records across five labelled views:

| View | Rows | Website use |
|---|---:|---|
| National Monthly | 132 | National trend |
| National Road User | 132 | Road-user ranking |
| National Age and Sex | 165 | Age and sex comparison |
| State Six-Monthly | 176 | State and territory heatmap |
| First Nations Age Group | 264 | First Nations age profile |
| **Total** | **869** | Five website sections |

The website uses a deployment copy at `website/data/traffic_injury_analysis_views.csv`.

## Website

The website is a responsive D3 data story with five visualisations:

- an annual line and area chart;
- a ranked road-user lollipop chart;
- a grouped age-and-sex bar chart;
- a state and territory heatmap; and
- a grouped First Nations status and age-group bar chart.

Users can select hospitalisations or bed-days, choose a year range, change the number of road-user categories displayed, and switch the First Nations comparison between counts and within-group shares.

The website code is organised as follows:

- `website/index.html` — page structure, controls and written context;
- `website/css/styles.css` — layout, colour and responsive styles;
- `website/js/data.js` — CSV loading, parsing, filtering and aggregation;
- `website/js/charts.js` — D3 chart modules;
- `website/js/app.js` — application state and controls;
- `website/js/a11y.js` — accessible chart helpers, tooltips and tables; and
- `website/vendor/d3.v7.min.js` — local D3 library.

## Accessibility

The website includes:

- semantic headings and landmarks;
- a skip link and visible keyboard focus;
- keyboard-accessible chart marks;
- SVG titles and descriptions;
- written chart summaries and accessible data tables;
- direct labels and patterns so colour is not the only encoding;
- high-contrast colours;
- responsive text and layouts; and
- reduced-motion support.

## Run the website locally

The CSV is loaded through JavaScript, so the website must be served over HTTP.

```powershell
cd website
python -m http.server 8080
```

Open `http://localhost:8080/` in a browser.

## Project files

- `data/processed/` — processed CSV used for analysis
- `data/workflow/` — exported KNIME workflow
- `docs/storyboard/` — current storyboard and KNIME explanation
- `docs/stand-up-1/` — Design Book draft, storyboard and presentation files
- `website/` — D3 website and deployment data
- `AI_USAGE.md` — declaration of generative AI use

## Current status

- The KNIME workflow and five analysis views have been created.
- The processed CSV has been exported and checked.
- The bed-day calculation has been updated to exclude died bed-days.
- The five D3 visualisations and shared controls are implemented.
- Accessibility features and supporting data tables are included.
- The storyboard, workflow explanation and Stand-up 1 materials are stored in the repository.

Usability evaluation, final team review and Mercury deployment still need to be completed before submission.
