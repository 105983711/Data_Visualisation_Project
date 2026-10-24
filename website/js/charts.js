/*
 * D3 chart modules for the Group 28 road-injury data story.
 * OpenAI Codex assisted with code generation. The team selected the chart
 * forms, narrative and interactions and must review all submitted code.
 */

import { createSvg, accessibleMarks, renderTable, emptyChart, formatNumber, formatPercent } from "./a11y.js";
import { AGE_ORDER } from "./data.js";

const metricLabel = metric => metric === "bed_days" ? "bed-days" : "hospitalisations";
const axisFormat = value => d3.format("~s")(value).replace("G", "B");

function addYAxis(svg, scale, margin, width, label) {
  svg.append("g").attr("class", "grid").attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(scale).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(scale).ticks(5).tickFormat(axisFormat));
  svg.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + (scale.range()[0] - margin.top) / 2)).attr("y", 16).attr("text-anchor", "middle").text(label);
}

function addLegend(svg, entries, x, y, patterns = false) {
  const legend = svg.append("g").attr("class", "legend").attr("transform", `translate(${x},${y})`);
  const item = legend.selectAll("g").data(entries).join("g").attr("transform", (_, i) => `translate(${i * 190},0)`);
  item.append("rect").attr("width", 18).attr("height", 18).attr("rx", 2)
    .attr("fill", d => patterns && d.pattern ? `url(#${d.pattern})` : d.colour);
  item.append("text").attr("x", 25).attr("y", 13).text(d => d.label);
}

export function renderTrend(container, data, metric, tableTarget, summaryTarget) {
  if (!data.length) return emptyChart(container, "No trend records are available for this period.");
  const label = metricLabel(metric);
  const description = `Line and area chart of annual ${label} from ${data[0].year} to ${data.at(-1).year}.`;
  const { svg, width, height } = createSvg(container, { id: "annual-trend", title: `Annual road injury ${label}`, description, height: 460 });
  const margin = { top: 38, right: 28, bottom: 58, left: 72 };
  const yearExtent = d3.extent(data, d => d.year);
  const xDomain = yearExtent[0] === yearExtent[1] ? [yearExtent[0] - .5, yearExtent[1] + .5] : yearExtent;
  const x = d3.scaleLinear().domain(xDomain).range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.12]).nice().range([height - margin.bottom, margin.top]);
  addYAxis(svg, y, margin, width, label[0].toUpperCase() + label.slice(1));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(Math.min(data.length, 11)).tickFormat(d3.format("d")));
  svg.append("path").datum(data).attr("class", "trend-area")
    .attr("d", d3.area().x(d => x(d.year)).y0(y(0)).y1(d => y(d.value)).curve(d3.curveMonotoneX));
  svg.append("path").datum(data).attr("class", "trend-line")
    .attr("d", d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX));
  const dots = svg.selectAll(".trend-dot").data(data).join("circle").attr("class", "trend-dot")
    .attr("cx", d => x(d.year)).attr("cy", d => y(d.value)).attr("r", 5);
  accessibleMarks(dots, d => `${d.year}: ${formatNumber(d.value)} ${label}`);
  const max = d3.greatest(data, d => d.value);
  svg.append("line").attr("class", "annotation-line").attr("x1", x(max.year)).attr("x2", x(max.year)).attr("y1", y(max.value) - 4).attr("y2", margin.top);
  svg.append("text").attr("class", "annotation").attr("x", Math.min(width - 165, x(max.year) + 8)).attr("y", margin.top + 4).text(`Peak: ${max.year} · ${formatNumber(max.value)}`);
  const first = data[0], last = data.at(-1), change = first.value ? (last.value / first.value - 1) : 0;
  summaryTarget.textContent = data.length === 1
    ? `${formatNumber(first.value)} ${label} were recorded in ${first.year}.`
    : `${label[0].toUpperCase() + label.slice(1)} changed from ${formatNumber(first.value)} in ${first.year} to ${formatNumber(last.value)} in ${last.year}, a ${Math.abs(change * 100).toFixed(1)}% ${change >= 0 ? "increase" : "decrease"}.`;
  renderTable(tableTarget, data, [{ key: "year", label: "Year" }, { key: "value", label: label[0].toUpperCase() + label.slice(1), format: formatNumber }]);
}

export function renderRoad(container, data, metric, limit, tableTarget, summaryTarget) {
  const shown = data.slice(0, limit);
  if (!shown.length) return emptyChart(container, "No road-user records are available for this period.");
  const label = metricLabel(metric);
  const { svg, width, height } = createSvg(container, { id: "road-user", title: `Road-user ${label}`, description: `Ranked lollipop chart showing ${shown.length} road-user categories.`, height: Math.max(420, shown.length * 48 + 100) });
  const margin = { top: 30, right: 75, bottom: 52, left: width < 600 ? 150 : 220 };
  const x = d3.scaleLinear().domain([0, d3.max(shown, d => d.value) * 1.08]).nice().range([margin.left, width - margin.right]);
  const y = d3.scaleBand().domain(shown.map(d => d.road_user)).range([margin.top, height - margin.bottom]).padding(.45);
  svg.append("g").attr("class", "grid").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5).tickSize(-(height - margin.top - margin.bottom)).tickFormat(""));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5).tickFormat(axisFormat));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).tickSize(0));
  svg.append("text").attr("class", "axis-label").attr("x", margin.left + (width - margin.left - margin.right) / 2).attr("y", height - 10).attr("text-anchor", "middle").text(label[0].toUpperCase() + label.slice(1));
  svg.selectAll(".lollipop-stem").data(shown).join("line").attr("class", "lollipop-stem")
    .attr("x1", x(0)).attr("x2", d => x(d.value)).attr("y1", d => y(d.road_user) + y.bandwidth() / 2).attr("y2", d => y(d.road_user) + y.bandwidth() / 2);
  const dots = svg.selectAll(".lollipop-dot").data(shown).join("circle").attr("class", "lollipop-dot")
    .attr("cx", d => x(d.value)).attr("cy", d => y(d.road_user) + y.bandwidth() / 2).attr("r", 8);
  accessibleMarks(dots, d => `${d.road_user}: ${formatNumber(d.value)} ${label}`);
  svg.selectAll(".value-label").data(shown).join("text").attr("class", "annotation")
    .attr("x", d => x(d.value) + 12).attr("y", d => y(d.road_user) + y.bandwidth() / 2 + 4).text(d => formatNumber(d.value));
  summaryTarget.textContent = `${shown[0].road_user} is the largest category in the selected period with ${formatNumber(shown[0].value)} ${label}.`;
  renderTable(tableTarget, data, [{ key: "road_user", label: "Road-user category" }, { key: "value", label: label[0].toUpperCase() + label.slice(1), format: formatNumber }]);
}

export function renderAgeSex(container, data, metric, tableTarget, summaryTarget) {
  if (!data.length) return emptyChart(container, "No age and sex records are available for this period.");
  const label = metricLabel(metric);
  const ageGroups = [...new Set(data.map(d => d.age_group))].sort((a, b) => AGE_ORDER.indexOf(a) - AGE_ORDER.indexOf(b));
  const sexes = [...new Set(data.map(d => d.sex))].filter(Boolean);
  const { svg, width, height } = createSvg(container, { id: "age-sex", title: `${label} by age group and sex`, description: `Grouped bar chart comparing ${sexes.join(", ")} across ${ageGroups.length} age groups.`, height: 500 });
  const margin = { top: 68, right: 24, bottom: 65, left: 72 };
  const x0 = d3.scaleBand().domain(ageGroups).range([margin.left, width - margin.right]).padding(.2);
  const x1 = d3.scaleBand().domain(sexes).range([0, x0.bandwidth()]).padding(.08);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.08]).nice().range([height - margin.bottom, margin.top]);
  const colourFor = sex => sex === "Female" ? "#2d57a1" : sex === "Male" ? "#075a67" : "#9a6e00";
  const patternFor = sex => sex === "Female" ? "age-female" : sex === "Male" ? "age-male" : "age-other";
  const defs = svg.append("defs");
  sexes.forEach((sex, i) => {
    const pattern = defs.append("pattern").attr("id", patternFor(sex)).attr("width", 8).attr("height", 8).attr("patternUnits", "userSpaceOnUse");
    pattern.append("rect").attr("width", 8).attr("height", 8).attr("fill", colourFor(sex));
    if (i > 0) pattern.append("path").attr("d", i === 1 ? "M0,8L8,0" : "M0,0L8,8 M-2,2L2,-2 M6,10L10,6").attr("stroke", "white").attr("stroke-width", 1.3).attr("opacity", .7);
  });
  addYAxis(svg, y, margin, width, label[0].toUpperCase() + label.slice(1));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x0));
  svg.append("text").attr("class", "axis-label").attr("x", margin.left + (width - margin.left - margin.right) / 2).attr("y", height - 12).attr("text-anchor", "middle").text("Age group");
  const bars = svg.selectAll(".age-bar").data(data).join("rect").attr("class", "age-bar")
    .attr("x", d => x0(d.age_group) + x1(d.sex)).attr("y", d => y(d.value)).attr("width", x1.bandwidth()).attr("height", d => y(0) - y(d.value))
    .attr("fill", d => `url(#${patternFor(d.sex)})`);
  accessibleMarks(bars, d => `${d.age_group}, ${d.sex}: ${formatNumber(d.value)} ${label}`);
  addLegend(svg, sexes.map(sex => ({ label: sex, colour: colourFor(sex), pattern: patternFor(sex) })), margin.left, 18, true);
  const max = d3.greatest(data, d => d.value);
  summaryTarget.textContent = `The largest age-and-sex total is ${max.sex}, age ${max.age_group}, with ${formatNumber(max.value)} ${label} in the selected period.`;
  renderTable(tableTarget, data, [{ key: "age_group", label: "Age group" }, { key: "sex", label: "Sex" }, { key: "value", label: label[0].toUpperCase() + label.slice(1), format: formatNumber }]);
}

export function renderState(container, data, metric, tableTarget, summaryTarget) {
  if (!data.length) return emptyChart(container, "No state or territory records are available for this period.");
  const label = metricLabel(metric);
  const years = [...new Set(data.map(d => d.year))].sort(d3.ascending);
  const totals = d3.rollup(data, values => d3.sum(values, d => d.value), d => d.state);
  const states = [...totals.keys()].sort((a, b) => d3.descending(totals.get(a), totals.get(b)));
  const { svg, width, height } = createSvg(container, { id: "state-heatmap", title: `${label} by state or territory and year`, description: `Heatmap with ${states.length} rows for jurisdictions and ${years.length} columns for years. Each cell also contains its value.`, height: Math.max(460, states.length * 48 + 120) });
  const margin = { top: 55, right: 25, bottom: 58, left: 75 };
  const x = d3.scaleBand().domain(years).range([margin.left, width - margin.right]).padding(.04);
  const y = d3.scaleBand().domain(states).range([margin.top, height - margin.bottom]).padding(.06);
  const max = d3.max(data, d => d.value);
  const colour = d3.scaleSequential().domain([0, max]).interpolator(t => d3.interpolateRgb("#f1eee4", "#075a67")(t));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).tickSize(0));
  svg.append("text").attr("class", "axis-label").attr("x", margin.left + (width - margin.left - margin.right) / 2).attr("y", height - 12).attr("text-anchor", "middle").text("Year");
  const cells = svg.selectAll(".heat-cell").data(data).join("rect").attr("class", "heat-cell")
    .attr("x", d => x(d.year)).attr("y", d => y(d.state)).attr("width", x.bandwidth()).attr("height", y.bandwidth()).attr("fill", d => colour(d.value));
  accessibleMarks(cells, d => `${d.state}, ${d.year}: ${formatNumber(d.value)} ${label}`);
  if (x.bandwidth() >= 48) svg.selectAll(".heat-label").data(data).join("text").attr("class", "heat-label").attr("x", d => x(d.year) + x.bandwidth() / 2).attr("y", d => y(d.state) + y.bandwidth() / 2).attr("fill", d => d.value > max * .48 ? "white" : "#13262f").text(d => axisFormat(d.value));
  const leader = states[0];
  summaryTarget.textContent = `${leader} has the largest selected-period total at ${formatNumber(totals.get(leader))} ${label}. Jurisdiction totals should be interpreted alongside population size.`;
  renderTable(tableTarget, [...data].sort((a, b) => d3.ascending(a.year, b.year) || d3.ascending(a.state, b.state)), [{ key: "year", label: "Year" }, { key: "state", label: "State or territory" }, { key: "value", label: label[0].toUpperCase() + label.slice(1), format: formatNumber }]);
}

export function renderFirstNations(container, data, metric, mode, tableTarget, summaryTarget) {
  if (!data.length) return emptyChart(container, "No First Nations comparison records are available for this period.");
  const label = metricLabel(metric);
  const groups = ["First Nations people", "Non-Indigenous"].filter(group => data.some(d => d.first_nations_status === group));
  const totals = d3.rollup(data, values => d3.sum(values, d => d.value), d => d.first_nations_status);
  const prepared = data.map(d => ({ ...d, displayValue: mode === "share" ? d.value / (totals.get(d.first_nations_status) || 1) : d.value }));
  const ages = [...new Set(prepared.map(d => d.age_group))].sort((a, b) => AGE_ORDER.indexOf(a) - AGE_ORDER.indexOf(b));
  const isShare = mode === "share";
  const valueLabel = isShare ? "Share within status group" : label[0].toUpperCase() + label.slice(1);
  const { svg, width, height } = createSvg(container, { id: "first-nations", title: `${valueLabel} by First Nations status and age group`, description: `Grouped bar chart comparing ${groups.join(" and ")} across age groups.`, height: 500 });
  const margin = { top: 68, right: 24, bottom: 68, left: 78 };
  const x0 = d3.scaleBand().domain(ages).range([margin.left, width - margin.right]).padding(.22);
  const x1 = d3.scaleBand().domain(groups).range([0, x0.bandwidth()]).padding(.08);
  const y = d3.scaleLinear().domain([0, d3.max(prepared, d => d.displayValue) * 1.1]).nice().range([height - margin.bottom, margin.top]);
  svg.append("g").attr("class", "grid").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(isShare ? d3.format(".0%") : axisFormat));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x0));
  svg.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", 18).attr("text-anchor", "middle").text(valueLabel);
  svg.append("text").attr("class", "axis-label").attr("x", margin.left + (width - margin.left - margin.right) / 2).attr("y", height - 12).attr("text-anchor", "middle").text("Age group");
  const colours = new Map([["First Nations people", "#b84a14"], ["Non-Indigenous", "#075a67"]]);
  const bars = svg.selectAll(".fn-bar").data(prepared).join("rect")
    .attr("class", d => `fn-bar ${d.first_nations_status === "First Nations people" ? "fn-first" : "fn-non"}`)
    .attr("x", d => x0(d.age_group) + x1(d.first_nations_status)).attr("y", d => y(d.displayValue)).attr("width", x1.bandwidth()).attr("height", d => y(0) - y(d.displayValue));
  accessibleMarks(bars, d => `${d.age_group}, ${d.first_nations_status}: ${isShare ? formatPercent(d.displayValue) : formatNumber(d.value) + " " + label}`);
  addLegend(svg, groups.map(group => ({ label: group, colour: colours.get(group) })), margin.left, 18);
  const firstNations = prepared.filter(d => d.first_nations_status === "First Nations people");
  const peak = d3.greatest(firstNations, d => d.displayValue);
  summaryTarget.textContent = isShare
    ? `Among published First Nations records, age ${peak.age_group} has the largest share of the selected ${label} total at ${formatPercent(peak.displayValue)}. This is a profile, not a risk rate.`
    : `The largest First Nations count is age ${peak.age_group}, with ${formatNumber(peak.value)} ${label}. Absolute totals reflect different population sizes.`;
  renderTable(tableTarget, prepared, [{ key: "age_group", label: "Age group" }, { key: "first_nations_status", label: "Status" }, { key: isShare ? "displayValue" : "value", label: valueLabel, format: isShare ? formatPercent : formatNumber }]);
}
