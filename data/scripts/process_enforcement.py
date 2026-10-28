"""Build chart-ready police-enforcement views from BITRE's official CSV.

Run from the repository root with:
    python data/scripts/process_enforcement.py

BITRE changed the file structure in 2023. Earlier years contain explicit
"All regions" / "All ages" totals; 2023-24 contain mutually exclusive
location-by-age detail. The two structures are deliberately aggregated in
separate branches to prevent double-counting.
"""

from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw" / "enforcement"
OUTPUTS = [
    ROOT / "data" / "processed" / "enforcement_views.csv",
    ROOT / "website" / "data" / "enforcement_views.csv",
]

METRIC_LABELS = {
    "speed_fines": "Speeding",
    "mobile_phone_use": "Mobile phone",
    "non_wearing_seatbelts": "Seatbelt",
    "unlicensed_driving": "Unlicensed driving",
}

# BITRE 2024 rates per 10,000 licence holders. These published rates allow
# fairer jurisdiction comparison than raw totals.
RATES_2024 = {
    "Speeding": {"ACT": 1979, "NSW": 1469, "NT": 2941, "QLD": 1913, "SA": 1355, "TAS": 1745, "VIC": 1470, "WA": 2154},
    "Mobile phone": {"ACT": 780, "NSW": 263, "NT": 15, "QLD": 181, "SA": 34, "TAS": 65, "VIC": 105, "WA": 17},
    "Seatbelt": {"ACT": 2, "NSW": 131, "NT": 60, "QLD": 95, "SA": 19, "TAS": 95, "VIC": 101, "WA": 9},
    "Unlicensed driving": {"ACT": 9, "NSW": 15, "NT": 26, "QLD": 60, "SA": 49, "TAS": 6, "VIC": 13, "WA": 9},
}


def detection_group(value: str) -> str:
    value = str(value)
    if value == "Police issued":
        return "Police issued"
    if value == "Not applicable":
        return "Not applicable"
    if "camera" in value.lower():
        return "Camera detected"
    return "Other / unknown"


def build_views() -> pd.DataFrame:
    fines = pd.read_csv(RAW / "fines.csv")
    fines["metric_label"] = fines["METRIC"].map(METRIC_LABELS)
    fines["detection_group"] = fines["DETECTION_METHOD"].map(detection_group)

    # 2008-22: use published aggregate rows. 2023-24: sum the detailed,
    # mutually exclusive age-by-location rows. Never combine both structures.
    early = fines[(fines.YEAR <= 2022) & (fines.LOCATION == "All regions") & (fines.AGE_GROUP == "All ages")]
    recent = fines[fines.YEAR >= 2023]
    annual = pd.concat([early, recent], ignore_index=True)
    annual = (annual.groupby(["YEAR", "metric_label", "detection_group"], as_index=False)["FINES"].sum())
    annual = annual.rename(columns={"YEAR": "year", "FINES": "value", "metric_label": "metric", "detection_group": "series"})
    annual.insert(0, "view_type", "Annual detection")

    # Detailed 2024 age profile. Unknown ages are excluded from the displayed
    # shares but are retained in the source file and disclosed on the page.
    age = fines[(fines.YEAR == 2024) & (~fines.AGE_GROUP.isin(["Unknown", "All ages"]))]
    age = age.groupby(["metric_label", "AGE_GROUP"], as_index=False)["FINES"].sum()
    age["value"] = age["FINES"]
    age["share"] = age["value"] / age.groupby("metric_label")["value"].transform("sum")
    age = age.rename(columns={"metric_label": "metric", "AGE_GROUP": "series"})
    age.insert(0, "view_type", "Age profile 2024")
    age["year"] = 2024
    age = age.drop(columns="FINES")

    rate_rows = [
        {"view_type": "State rates 2024", "year": 2024, "metric": metric, "series": state, "value": rate}
        for metric, states in RATES_2024.items() for state, rate in states.items()
    ]
    rates = pd.DataFrame(rate_rows)

    columns = ["view_type", "year", "metric", "series", "value", "share"]
    combined = pd.concat([annual, age, rates], ignore_index=True)
    for column in columns:
        if column not in combined:
            combined[column] = pd.NA
    return combined[columns].sort_values(["view_type", "year", "metric", "series"], na_position="last")


if __name__ == "__main__":
    result = build_views()
    for path in OUTPUTS:
        path.parent.mkdir(parents=True, exist_ok=True)
        result.to_csv(path, index=False)
        print(f"Wrote {len(result):,} rows to {path}")
