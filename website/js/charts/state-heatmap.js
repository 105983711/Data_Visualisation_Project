// Research question: How did state and territory totals vary over time?
import { createSvg, accessibleMarks, formatNumber } from "../a11y.js";
import { addMeasureLabel, axisFormat } from "./chart-utils.js";

export function renderStateHeatmap(data, label) {
  const container = document.querySelector("#dashboard-state-heatmap");
  const years = [...new Set(data.map(d => d.year))].sort(d3.ascending);
  const stateTotals = d3.rollup(data, values => d3.sum(values, d => d.value), d => d.state);
  const states = [...stateTotals.keys()].sort((a, b) => d3.descending(stateTotals.get(a), stateTotals.get(b)));
  const { svg, width, height } = createSvg(container, {
    id: "dashboard-state-heatmap",
    title: `${label} by state and year`,
    description: "Heatmap comparing annual state and territory totals across the selected period.",
    height: 315
  });
  const margin = { top: 22, right: 12, bottom: 40, left: 50 };
  addMeasureLabel(svg, width, height, label);
  const x = d3.scaleBand().domain(years).range([margin.left, width - margin.right]).padding(.04);
  const y = d3.scaleBand().domain(states).range([margin.top, height - margin.bottom]).padding(.06);
  const max = d3.max(data, d => d.value) || 1;
  const colour = d3.scaleSequential().domain([0, max]).interpolator(t => d3.interpolateRgb("#f5f1e8", "#075a67")(t));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).tickSize(0));
  const cells = svg.selectAll(".state-cell").data(data).join("rect").attr("class", "state-cell")
    .attr("x", d => x(d.year)).attr("y", d => y(d.state)).attr("width", x.bandwidth()).attr("height", y.bandwidth())
    .attr("fill", d => colour(d.value));
  accessibleMarks(cells, d => `${d.state}, ${d.year}: ${formatNumber(d.value)} ${label}`);
  if (x.bandwidth() >= 38) {
    svg.selectAll(".heat-label").data(data).join("text").attr("class", "heat-label")
      .attr("x", d => x(d.year) + x.bandwidth() / 2).attr("y", d => y(d.state) + y.bandwidth() / 2)
      .attr("fill", d => d.value > max * .48 ? "white" : "#13262f").text(d => axisFormat(d.value));
  }
}
