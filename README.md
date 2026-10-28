# Hospitalised Injuries from Road Crashes in Australia

**COS30045 Data Visualisation | Group 28**

## Project overview

This submission contains two linked, focused D3 stories. The first explores BITRE Hospitalised Injury Data for Australia from 2011 to 2021. The second explores BITRE Road Safety Enforcement Data from 2008 to 2024, including detection methods, comparable jurisdiction rates and the detailed age information published from 2023.

The dataset reports absolute hospitalisation counts. These counts are not population-adjusted rates.

## Team

- Mohona Tabassum Sneha
- Iqbal Sameer

## Website

The accessible D3 data story is in `website/`. Serve that directory over HTTP to run it locally:

```powershell
cd website
python -m http.server 8080
```

Then open `http://localhost:8080/` for the hospitalisation story or `http://localhost:8080/enforcement.html` for the enforcement story. Each page links to the other.

## Data and workflow

- Processed KNIME export: `data/processed/traffic_injury_analysis_views.csv`
- Exported KNIME workflow: `data/workflow/Group28.knwf`
- Website deployment copy: `website/data/traffic_injury_analysis_views.csv`
- Enforcement source data: `data/raw/enforcement/`
- Reproducible enforcement processing: `data/scripts/process_enforcement.py`
- Enforcement chart-ready data: `data/processed/enforcement_views.csv`

## Stand-up 1 materials

- Design Book draft: `docs/stand-up-1/Design Book Draft.docx` and `docs/stand-up-1/Design Book Draft.pdf`
- Presentation: `docs/stand-up-1/Stand-up 1 Presentation.pptx` and `docs/stand-up-1/Stand-up 1 Presentation.pdf`
- Proposed storyboard: `docs/stand-up-1/Road Injury Storyboard.pptx` and `docs/stand-up-1/Road Injury Storyboard.pdf`

## Repository contents

- `data/` — project data materials
- `docs/stand-up-1/` — Stand-up 1 documents and presentation materials
- `website/` — responsive D3 data story
- `AI_USAGE.md` — required GenAI acknowledgement and prompt summary
