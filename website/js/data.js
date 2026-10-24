/*
 * Data preparation for the Group 28 visualisation.
 * OpenAI Codex assisted with this implementation. The team directed the work,
 * supplied the KNIME export and is responsible for reviewing the final code.
 */

const VIEW = {
  monthly: "National Monthly",
  road: "National Road User",
  ageSex: "National Age and Sex",
  state: "State Six-Monthly",
  firstNations: "First Nations Age Group"
};

const AGE_ORDER = ["0-7", "8-16", "17-25", "26-39", "40-64", "65-74", "65+", "75+", "Missing"];

function parseNumber(value) {
  const cleaned = String(value ?? "").trim().replaceAll(",", "");
  if (!cleaned || cleaned.toLowerCase() === "n.p." || cleaned === "?") return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function parseRow(row) {
  return {
    ...row,
    year: parseNumber(row.year),
    month_number: parseNumber(row.month_number),
    hospitalisations: parseNumber(row.hospitalisations),
    bed_days: parseNumber(row.bed_days),
    age_order: parseNumber(row.age_order),
    period_date: row.period_date ? new Date(`${row.period_date}T00:00:00`) : null
  };
}

export async function loadData(url = "data/traffic_injury_analysis_views.csv") {
  const rows = await d3.csv(url, parseRow);
  if (!rows.length) throw new Error("The processed CSV contains no rows.");
  return rows;
}

export function yearsIn(rows) {
  return [...new Set(rows.map(d => d.year).filter(Number.isFinite))].sort(d3.ascending);
}

export function view(rows, name, startYear, endYear) {
  return rows.filter(d => d.view_type === name && d.year >= startYear && d.year <= endYear);
}

export function sumBy(rows, keys, metric) {
  const groups = d3.rollups(
    rows,
    values => d3.sum(values, d => d[metric] ?? 0),
    ...keys.map(key => d => d[key])
  );
  const flatten = (items, depth = 0, record = {}) => items.flatMap(([key, value]) => {
    const next = { ...record, [keys[depth]]: key };
    return depth === keys.length - 1 ? [{ ...next, value }] : flatten(value, depth + 1, next);
  });
  return flatten(groups);
}

export function trendData(rows, metric, startYear, endYear) {
  return sumBy(view(rows, VIEW.monthly, startYear, endYear), ["year"], metric).sort((a, b) => d3.ascending(a.year, b.year));
}

export function roadData(rows, metric, startYear, endYear) {
  return sumBy(view(rows, VIEW.road, startYear, endYear), ["road_user"], metric).sort((a, b) => d3.descending(a.value, b.value));
}

export function ageSexData(rows, metric, startYear, endYear) {
  const data = sumBy(view(rows, VIEW.ageSex, startYear, endYear), ["age_group", "sex"], metric);
  return data.sort((a, b) => AGE_ORDER.indexOf(a.age_group) - AGE_ORDER.indexOf(b.age_group));
}

export function stateData(rows, metric, startYear, endYear) {
  return sumBy(view(rows, VIEW.state, startYear, endYear), ["state", "year"], metric);
}

export function firstNationsData(rows, metric, startYear, endYear) {
  const data = sumBy(view(rows, VIEW.firstNations, startYear, endYear), ["age_group", "first_nations_status"], metric);
  return data.sort((a, b) => AGE_ORDER.indexOf(a.age_group) - AGE_ORDER.indexOf(b.age_group));
}

export { VIEW, AGE_ORDER };
