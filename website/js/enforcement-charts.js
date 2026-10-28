import { createSvg, accessibleMarks, renderTable, emptyChart, formatNumber, formatPercent } from "./a11y.js";
import { METRICS, AGE_ORDER } from "./enforcement-data.js";

const colours = new Map([
  ["Police issued", "#075a67"],
  ["Camera detected", "#b84a14"],
  ["Not applicable", "#52646b"],
  ["Other / unknown", "#d19a13"]
]);
const seriesOrder = ["Police issued", "Camera detected", "Not applicable", "Other / unknown"];
const axisNumber = value => d3.format("~s")(value).replace("G", "B");

function addLegend(svg, entries, x, y) {
  const legend = svg.append("g").attr("class", "legend").attr("transform", `translate(${x},${y})`);
  const item = legend.selectAll("g").data(entries).join("g").attr("transform", (_, i) => `translate(${i * 175},0)`);
  item.append("rect").attr("width", 18).attr("height", 18).attr("rx", 2).attr("fill", d => colours.get(d));
  item.append("text").attr("x", 25).attr("y", 13).text(d => d);
}

function annualWide(data) {
  const grouped = d3.rollup(data, values => d3.sum(values, d => d.value), d => d.year, d => d.series);
  return [...grouped].sort(([a], [b]) => d3.ascending(a, b)).map(([year, values]) => ({
    year,
    ...Object.fromEntries(seriesOrder.map(series => [series, values.get(series) || 0]))
  }));
}

export function renderDetectionTrend(container, rows, metric, tableTarget, summaryTarget) {
  const data = rows.filter(d => d.metric === metric);
  if (!data.length) return emptyChart(container, "No annual enforcement records are available.");
  const wide = annualWide(data);
  const activeSeries = seriesOrder.filter(series => wide.some(d => d[series] > 0));
  const stacked = d3.stack().keys(activeSeries)(wide);
  const { svg, width, height } = createSvg(container, {
    id: "enforcement-trend",
    title: `${metric} fines by detection method`,
    description: `Stacked bars show annual ${metric.toLowerCase()} fines and the contribution of each detection method.`,
    height: 500
  });
  const margin = { top: 68, right: 24, bottom: 64, left: 76 };
  const x = d3.scaleBand().domain(wide.map(d => d.year)).range([margin.left, width - margin.right]).padding(.18);
  const y = d3.scaleLinear().domain([0, d3.max(wide, d => d3.sum(activeSeries, s => d[s])) * 1.08]).nice().range([height - margin.bottom, margin.top]);
  svg.append("g").attr("class", "grid").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(axisNumber));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % (width < 600 ? 4 : 2) === 0)));
  svg.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", 18).attr("text-anchor", "middle").text("Fines");
  svg.append("text").attr("class", "axis-label").attr("x", (margin.left + width - margin.right) / 2).attr("y", height - 12).attr("text-anchor", "middle").text("Year");
  const groups = svg.selectAll(".stack-group").data(stacked).join("g").attr("class", "stack-group").attr("fill", d => colours.get(d.key));
  const bars = groups.selectAll("rect").data(layer => layer.map(d => ({ ...d, key: layer.key }))).join("rect")
    .attr("x", d => x(d.data.year)).attr("y", d => y(d[1])).attr("height", d => Math.max(0, y(d[0]) - y(d[1]))).attr("width", x.bandwidth());
  accessibleMarks(bars, d => `${d.data.year}, ${d.key}: ${formatNumber(d.data[d.key])} ${metric.toLowerCase()} fines`);
  addLegend(svg, activeSeries, margin.left, 20);
  const totals = wide.map(d => ({ year: d.year, value: d3.sum(activeSeries, s => d[s]) }));
  const peak = d3.greatest(totals, d => d.value);
  const latest = totals.at(-1);
  summaryTarget.textContent = `${metric} fines peaked at ${formatNumber(peak.value)} in ${peak.year}. The latest total is ${formatNumber(latest.value)} in ${latest.year}; changes can reflect enforcement activity and detection technology as well as behaviour.`;
  renderTable(tableTarget, data.sort((a, b) => d3.ascending(a.year, b.year) || d3.ascending(a.series, b.series)), [
    { key: "year", label: "Year" }, { key: "series", label: "Detection method" }, { key: "value", label: "Fines", format: formatNumber }
  ]);
}

export function renderDetectionMix(container, annualRows, tableTarget, summaryTarget) {
  const data = annualRows.filter(d => d.year === 2024 && ["Speeding", "Mobile phone", "Seatbelt"].includes(d.metric));
  const totals = d3.rollup(data, values => d3.sum(values, d => d.value), d => d.metric);
  const prepared = data.filter(d => ["Police issued", "Camera detected"].includes(d.series)).map(d => ({ ...d, share: d.value / totals.get(d.metric) }));
  const { svg, width, height } = createSvg(container, { id: "detection-mix", title: "Police and camera share of 2024 fines", description: "One hundred percent stacked horizontal bars compare the detection mix for three offence types.", height: 390 });
  const margin = { top: 72, right: 30, bottom: 58, left: width < 560 ? 120 : 155 };
  const metrics = ["Speeding", "Mobile phone", "Seatbelt"];
  const x = d3.scaleLinear().domain([0, 1]).range([margin.left, width - margin.right]);
  const y = d3.scaleBand().domain(metrics).range([margin.top, height - margin.bottom]).padding(.34);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).tickSize(0));
  const byMetric = d3.group(prepared, d => d.metric);
  const segments = [];
  metrics.forEach(metric => {
    let start = 0;
    seriesOrder.slice(0, 2).forEach(series => {
      const row = (byMetric.get(metric) || []).find(d => d.series === series);
      const share = row?.share || 0;
      segments.push({ metric, series, value: row?.value || 0, start, end: start + share, share });
      start += share;
    });
  });
  const bars = svg.selectAll(".mix-segment").data(segments).join("rect").attr("class", "mix-segment")
    .attr("x", d => x(d.start)).attr("y", d => y(d.metric)).attr("width", d => x(d.end) - x(d.start)).attr("height", y.bandwidth()).attr("fill", d => colours.get(d.series));
  accessibleMarks(bars, d => `${d.metric}, ${d.series}: ${formatNumber(d.value)} fines, ${formatPercent(d.share)}`);
  svg.selectAll(".mix-label").data(segments.filter(d => d.share >= .1)).join("text").attr("class", "mix-label")
    .attr("x", d => (x(d.start) + x(d.end)) / 2).attr("y", d => y(d.metric) + y.bandwidth() / 2 + 5).attr("text-anchor", "middle").text(d => d3.format(".0%")(d.share));
  addLegend(svg, ["Police issued", "Camera detected"], margin.left, 22);
  const camera = prepared.filter(d => d.series === "Camera detected");
  const biggest = d3.greatest(camera, d => d.share);
  summaryTarget.textContent = `Cameras account for ${formatPercent(biggest.share)} of ${biggest.metric.toLowerCase()} fines in 2024. Detection mix is essential context: a rise in recorded fines need not mean the same rise in offending.`;
  renderTable(tableTarget, prepared, [
    { key: "metric", label: "Offence" }, { key: "series", label: "Detection method" }, { key: "value", label: "Fines", format: formatNumber }, { key: "share", label: "Share", format: formatPercent }
  ]);
}

export function renderStateRates(container, rows, metric, tableTarget, summaryTarget) {
  const data = rows.filter(d => d.metric === metric).sort((a, b) => d3.descending(a.value, b.value));
  if (!data.length) return emptyChart(container, "No jurisdiction rate records are available.");
  const { svg, width, height } = createSvg(container, { id: "state-rates", title: `${metric} fines per 10,000 licence holders`, description: `Ranked dot plot comparing eight Australian jurisdictions in 2024.`, height: 470 });
  const margin = { top: 30, right: 90, bottom: 60, left: 70 };
  const x = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.1]).nice().range([margin.left, width - margin.right]);
  const y = d3.scaleBand().domain(data.map(d => d.series)).range([margin.top, height - margin.bottom]).padding(.45);
  svg.append("g").attr("class", "grid").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5).tickSize(-(height - margin.top - margin.bottom)).tickFormat(""));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).tickSize(0));
  svg.append("text").attr("class", "axis-label").attr("x", (margin.left + width - margin.right) / 2).attr("y", height - 12).attr("text-anchor", "middle").text("Fines per 10,000 licence holders");
  svg.selectAll(".rate-stem").data(data).join("line").attr("class", "rate-stem").attr("x1", x(0)).attr("x2", d => x(d.value)).attr("y1", d => y(d.series) + y.bandwidth()/2).attr("y2", d => y(d.series) + y.bandwidth()/2);
  const dots = svg.selectAll(".rate-dot").data(data).join("circle").attr("class", "rate-dot").attr("cx", d => x(d.value)).attr("cy", d => y(d.series) + y.bandwidth()/2).attr("r", 8);
  accessibleMarks(dots, d => `${d.series}: ${formatNumber(d.value)} ${metric.toLowerCase()} fines per 10,000 licence holders`);
  svg.selectAll(".rate-label").data(data).join("text").attr("class", "annotation").attr("x", d => x(d.value) + 12).attr("y", d => y(d.series) + y.bandwidth()/2 + 4).text(d => formatNumber(d.value));
  summaryTarget.textContent = `${data[0].series} records the highest published ${metric.toLowerCase()} rate at ${formatNumber(data[0].value)} fines per 10,000 licence holders; ${data.at(-1).series} records the lowest at ${formatNumber(data.at(-1).value)}.`;
  renderTable(tableTarget, data, [{ key: "series", label: "Jurisdiction" }, { key: "value", label: "Fines per 10,000 licence holders", format: formatNumber }]);
}

export function renderAgeProfile(container, rows, tableTarget, summaryTarget) {
  const data = rows.filter(d => METRICS.includes(d.metric) && AGE_ORDER.includes(d.series));
  const { svg, width, height } = createSvg(container, { id: "age-profile", title: "2024 fine distribution by age and offence", description: "Heatmap shows each age group's share of known-age fines within four offence types.", height: 440 });
  const margin = { top: 50, right: 25, bottom: 76, left: width < 600 ? 125 : 170 };
  const x = d3.scaleBand().domain(AGE_ORDER).range([margin.left, width - margin.right]).padding(.05);
  const y = d3.scaleBand().domain(METRICS).range([margin.top, height - margin.bottom]).padding(.06);
  const max = d3.max(data, d => d.share);
  const colour = d3.scaleSequential().domain([0, max]).interpolator(t => d3.interpolateRgb("#fff6df", "#8f2f0a")(t));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).tickSize(0));
  svg.append("text").attr("class", "axis-label").attr("x", (margin.left + width - margin.right) / 2).attr("y", height - 20).attr("text-anchor", "middle").text("Age group");
  const cells = svg.selectAll(".age-cell").data(data).join("rect").attr("class", "age-cell").attr("x", d => x(d.series)).attr("y", d => y(d.metric)).attr("width", x.bandwidth()).attr("height", y.bandwidth()).attr("fill", d => colour(d.share));
  accessibleMarks(cells, d => `${d.metric}, age ${d.series}: ${formatNumber(d.value)} fines, ${formatPercent(d.share)} of known-age fines`);
  svg.selectAll(".age-share-label").data(data).join("text").attr("class", "age-share-label").attr("x", d => x(d.series) + x.bandwidth()/2).attr("y", d => y(d.metric) + y.bandwidth()/2 + 4).attr("text-anchor", "middle").attr("fill", d => d.share > max * .56 ? "white" : "#13262f").text(d => d3.format(".0%")(d.share));
  const peak = d3.greatest(data, d => d.share);
  summaryTarget.textContent = `The strongest concentration is ${peak.metric.toLowerCase()} fines among people aged ${peak.series}, representing ${formatPercent(peak.share)} of that offence’s fines with a known age in 2024.`;
  renderTable(tableTarget, data, [{ key: "metric", label: "Offence" }, { key: "series", label: "Age group" }, { key: "value", label: "Fines", format: formatNumber }, { key: "share", label: "Known-age share", format: formatPercent }]);
}
