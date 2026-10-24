# Data files

## Processed website data

`processed/traffic_injury_analysis_views.csv` is the verified KNIME export used by the D3 website. It contains 869 records across five named views:

- National Monthly: 132 rows
- National Road User: 132 rows
- National Age and Sex: 165 rows
- State Six-Monthly: 176 rows
- First Nations Age Group: 264 rows

The website carries a deployment copy at `website/data/traffic_injury_analysis_views.csv`.

## KNIME workflow

`workflow/Group28.knwf` is the exported Group 28 workflow. The `.knwf` package contains the source workbooks and data dictionary used during processing. It was validated by executing an extracted copy in KNIME batch mode and checking the regenerated CSV.

## Source and scope

Source: Bureau of Infrastructure and Transport Research Economics, Hospitalised Injury Data, 2011-2021.

The values are absolute counts. They are not population-adjusted rates and should not be interpreted as individual risk. Published `n.p.` values are treated as missing, not zero.
