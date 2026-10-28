export async function loadEnforcementData() {
  return d3.csv("data/enforcement_views.csv", row => ({
    view_type: row.view_type,
    year: Number(row.year),
    metric: row.metric,
    series: row.series,
    value: Number(row.value),
    share: row.share === "" ? null : Number(row.share)
  }));
}

export const METRICS = ["Speeding", "Mobile phone", "Seatbelt", "Unlicensed driving"];
export const AGE_ORDER = ["0-16", "17-25", "26-39", "40-64", "65 and over"];

export const view = (rows, name) => rows.filter(row => row.view_type === name);
