// Research question: How did the age profile differ by First Nations status?
import { createSvg, accessibleMarks, formatPercent } from "../a11y.js";
import { AGE_ORDER } from "../data.js";
import { addMeasureLabel } from "./chart-utils.js";
const FIRST_NATIONS = "First Nations people";
const NON_INDIGENOUS = "Non-Indigenous";

export function renderFirstNationsChart(data, label) {
  const container = document.querySelector("#dashboard-fn");
  const groups = [FIRST_NATIONS, NON_INDIGENOUS].filter(group =>
    data.some(d => d.first_nations_status === group),
  );
  const totals = d3.rollup(data, values => d3.sum(values, d => d.value), d => d.first_nations_status);
  const prepared = data.map(d => ({
    ...d,
    share: d.value / (totals.get(d.first_nations_status) || 1),
  }));
  const ages = [...new Set(data.map(d => d.age_group))]
    .sort((a, b) => AGE_ORDER.indexOf(a) - AGE_ORDER.indexOf(b));
  const rows = ages.map(age => ({
    age,
    values: groups.map(group => prepared.find(d =>
      d.age_group === age && d.first_nations_status === group,
    )).filter(Boolean),
  }));
  const { svg, width, height } = createSvg(container, {
    id: "dashboard-first-nations",
    title: "First Nations age profile shares",
    description: "Dumbbell plot comparing the share of each status group total recorded in each age group.",
    height: 315
  });
  const margin = { top: 45, right: 22, bottom: 45, left: 60 };
  addMeasureLabel(svg, width, height, label);
  const maximumShare = d3.max(prepared, d => d.share) || 0;
  const x = d3.scaleLinear()
    .domain([0, Math.max(0.4, maximumShare * 1.08)])
    .nice()
    .range([margin.left, width - margin.right]);
  const y = d3.scaleBand()
    .domain(ages)
    .range([margin.top, height - margin.bottom])
    .padding(0.42);

  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(-(height - margin.top - margin.bottom)).tickFormat(""));
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")));
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0).tickPadding(9))
    .call(axis => axis.select(".domain").remove());

  svg.selectAll(".fn-connector")
    .data(rows.filter(row => row.values.length > 1))
    .join("line")
    .attr("class", "fn-connector")
    .attr("x1", row => x(d3.min(row.values, d => d.share)))
    .attr("x2", row => x(d3.max(row.values, d => d.share)))
    .attr("y1", row => y(row.age) + y.bandwidth() / 2)
    .attr("y2", row => y(row.age) + y.bandwidth() / 2)
    .attr("stroke", "#9aa6a6")
    .attr("stroke-width", 3);

  const dots = svg.selectAll(".fn-dot")
    .data(prepared)
    .join("circle")
    .attr("class", d => `fn-dot ${d.first_nations_status === FIRST_NATIONS ? "fn-first" : "fn-non"}`)
    .attr("cx", d => x(d.share))
    .attr("cy", d => y(d.age_group) + y.bandwidth() / 2)
    .attr("r", 6.5)
    .attr("stroke", "#fffdf8")
    .attr("stroke-width", 2);
  accessibleMarks(
    dots,
    d => `${d.age_group}, ${d.first_nations_status}: ${formatPercent(d.share)} of that status group’s ${label}`,
  );

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${margin.left},14)`);
  const entry = legend.selectAll("g")
    .data(groups)
    .join("g")
    .attr("transform", (_, index) => `translate(${index * 180},0)`);
  entry.append("circle")
    .attr("cx", 6.5)
    .attr("cy", 6.5)
    .attr("r", 6.5)
    .attr("fill", group => group === FIRST_NATIONS ? "#b84a14" : "#075a67");
  entry.append("text").attr("x", 19).attr("y", 10).text(group => group);
}
