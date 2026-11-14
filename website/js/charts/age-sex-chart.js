// Research question: How were recorded totals distributed by age group and gender?
// The official source field is named "sex"; the dashboard presents it as recorded gender.
import { createSvg, accessibleMarks, formatNumber } from "../a11y.js";
import { AGE_ORDER } from "../data.js";
import { addGridYAxis, addMeasureLabel } from "./chart-utils.js";

export function renderAgeSexChart(data, label) {
  const container = document.querySelector("#dashboard-age");
  const ages = [...new Set(data.map(d => d.age_group))]
    .sort((a, b) => AGE_ORDER.indexOf(a) - AGE_ORDER.indexOf(b));
  const genders = ["Female", "Male", "intersex or indeterminate or missing"]
    .filter(gender => data.some(d => d.sex === gender));
  const colours = new Map([
    ["Female", "#b84a14"],
    ["Male", "#075a67"],
    ["intersex or indeterminate or missing", "#d19a13"],
  ]);
  const { svg, width, height } = createSvg(container, {
    id: "dashboard-age-gender",
    title: `${label} by age group and gender`,
    description: "Grouped vertical bars compare recorded gender totals within each age group.",
    height: 315,
  });
  const margin = { top: 42, right: 20, bottom: 42, left: 54 };
  addMeasureLabel(svg, width, height, label);
  const xAge = d3.scaleBand().domain(ages).range([margin.left, width - margin.right]).padding(.18);
  const xGender = d3.scaleBand().domain(genders).range([0, xAge.bandwidth()]).padding(.08);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) || 1]).nice()
    .range([height - margin.bottom, margin.top]);

  addGridYAxis(svg, y, margin, width);
  svg.append("g").attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xAge).tickSize(0).tickPadding(8));

  const bars = svg.selectAll(".age-gender-bar").data(data).join("rect")
    .attr("class", "age-gender-bar")
    .attr("x", d => xAge(d.age_group) + xGender(d.sex))
    .attr("y", d => y(d.value))
    .attr("width", xGender.bandwidth())
    .attr("height", d => y(0) - y(d.value))
    .attr("fill", d => colours.get(d.sex) || "#d19a13");
  accessibleMarks(bars, d => `${d.age_group}, ${d.sex}: ${formatNumber(d.value)} ${label}`);

  const peak = d3.greatest(data, d => d.value);
  if (peak) {
    svg.append("text").attr("class", "annotation-text")
      .attr("x", xAge(peak.age_group) + xGender(peak.sex) + xGender.bandwidth() / 2)
      .attr("y", y(peak.value) - 6).attr("text-anchor", "middle")
      .text(formatNumber(peak.value));
  }

  const legendLabels = new Map([
    ["Female", "Female"],
    ["Male", "Male"],
    ["intersex or indeterminate or missing", "Intersex, indeterminate or missing"],
  ]);
  const legend = svg.append("g").attr("class", "legend age-gender-legend")
    .attr("transform", `translate(${margin.left},14)`);
  const entries = legend.selectAll("g").data(genders).join("g")
    .attr("transform", (_, i) => `translate(${i * (i === 2 ? 120 : 100)},0)`);
  entries.append("rect").attr("width", 13).attr("height", 11).attr("rx", 2)
    .attr("fill", d => colours.get(d));
  entries.append("text").attr("x", 18).attr("y", 10).text(d => legendLabels.get(d));
}
