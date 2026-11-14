// Research question: Which states and territories recorded the largest totals?
import { createSvg, accessibleMarks, formatNumber } from "../a11y.js";
import { addMeasureLabel, axisFormat } from "./chart-utils.js";

export function renderStateRankingChart(data, label) {
  const container = document.querySelector("#dashboard-state");
  const rows = d3.rollups(data, values => d3.sum(values, d => d.value), d => d.state)
    .map(([state, value]) => ({ state, value }))
    .sort((a, b) => d3.descending(a.value, b.value));
  const { svg, width, height } = createSvg(container, {
    id: "dashboard-state-ranking",
    title: `State and territory ranking by ${label}`,
    description: "Horizontal bars rank states and territories by the selected-period recorded total.",
    height: 315,
  });
  const margin = { top: 24, right: 72, bottom: 38, left: 58 };
  addMeasureLabel(svg, width, height, label);
  const x = d3.scaleLinear().domain([0, d3.max(rows, d => d.value) || 1]).nice()
    .range([margin.left, width - margin.right]);
  const y = d3.scaleBand().domain(rows.map(d => d.state))
    .range([margin.top, height - margin.bottom]).padding(.24);

  svg.append("g").attr("class", "grid")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(4).tickSize(-(height - margin.top - margin.bottom)).tickFormat(""));
  svg.append("g").attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(4).tickFormat(axisFormat));
  svg.append("g").attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0).tickPadding(8));

  const bars = svg.selectAll(".state-ranking-bar").data(rows).join("rect")
    .attr("class", "state-ranking-bar")
    .attr("x", margin.left).attr("y", d => y(d.state))
    .attr("width", d => x(d.value) - margin.left).attr("height", y.bandwidth())
    .attr("fill", (_, i) => i === 0 ? "#b84a14" : "#075a67");
  accessibleMarks(bars, d => `${d.state}: ${formatNumber(d.value)} ${label}`);
  svg.selectAll(".state-ranking-value").data(rows).join("text")
    .attr("class", "state-ranking-value")
    .attr("x", d => x(d.value) + 6).attr("y", d => y(d.state) + y.bandwidth() / 2 + 4)
    .text(d => formatNumber(d.value));
}
