// Research question: How did hospitalisations and bed-days change over time?
import { createSvg, accessibleMarks, formatNumber } from "../a11y.js";
import { addGridYAxis, addMeasureLabel } from "./chart-utils.js";

export function renderTrendChart(data, label) {
  const container = document.querySelector("#dashboard-trend");
  const { svg, width, height } = createSvg(container, {
    id: "dashboard-national-trend",
    title: `Annual ${label}`,
    description: `Annual ${label} for the selected years.`,
    height: 285
  });
  const margin = { top: 20, right: 24, bottom: 38, left: 64 };
  addMeasureLabel(svg, width, height, label);
  const extent = d3.extent(data, d => d.year);
  const xDomain = extent[0] === extent[1] ? [extent[0] - .5, extent[1] + .5] : extent;
  const x = d3.scaleLinear().domain(xDomain).range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.12]).nice().range([height - margin.bottom, margin.top]);
  addGridYAxis(svg, y, margin, width);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(Math.min(data.length, 11)).tickFormat(d3.format("d")));
  const peak = d3.greatest(data, d => d.value);
  const gradientId = "trend-route-gradient";
  const fillId = "trend-area-gradient";
  const peakOffset = peak && extent[1] !== extent[0]
    ? `${((peak.year - extent[0]) / (extent[1] - extent[0])) * 100}%`
    : "70%";
  const defs = svg.append("defs");
  const routeGradient = defs.append("linearGradient").attr("id", gradientId)
    .attr("x1", "0%").attr("x2", "100%").attr("y1", "0%").attr("y2", "0%");
  routeGradient.append("stop").attr("offset", "0%").attr("stop-color", "#0b6570");
  routeGradient.append("stop").attr("offset", peakOffset).attr("stop-color", "#c45117");
  routeGradient.append("stop").attr("offset", "100%").attr("stop-color", "#0b6570");
  const areaGradient = defs.append("linearGradient").attr("id", fillId)
    .attr("x1", "0%").attr("x2", "0%").attr("y1", "0%").attr("y2", "100%");
  areaGradient.append("stop").attr("offset", "0%").attr("stop-color", "#8bc9c2").attr("stop-opacity", .42);
  areaGradient.append("stop").attr("offset", "100%").attr("stop-color", "#8bc9c2").attr("stop-opacity", .03);

  const line = d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX);
  svg.append("path").datum(data).attr("class", "trend-fill")
    .attr("fill", `url(#${fillId})`)
    .attr("d", d3.area().x(d => x(d.year)).y0(y(0)).y1(d => y(d.value)).curve(d3.curveMonotoneX));
  svg.append("path").datum(data).attr("class", "trend-road-shadow").attr("d", line);
  svg.append("path").datum(data).attr("class", "trend-route")
    .attr("stroke", `url(#${gradientId})`).attr("d", line);
  if (peak) {
    const tagX = Math.min(width - margin.right - 78, Math.max(margin.left + 4, x(peak.year) - 37));
    svg.append("line").attr("class", "peak-guide")
      .attr("x1", x(peak.year)).attr("x2", x(peak.year))
      .attr("y1", margin.top + 24).attr("y2", y(peak.value) - 9);
    svg.append("rect").attr("class", "peak-tag").attr("x", tagX).attr("y", margin.top)
      .attr("width", 74).attr("height", 22).attr("rx", 11);
    svg.append("text").attr("class", "peak-tag-text")
      .attr("x", tagX + 37).attr("y", margin.top + 15).attr("text-anchor", "middle")
      .text(`PEAK ${peak.year}`);
  }
  const dots = svg.selectAll(".trend-dot").data(data).join("circle").attr("class", "trend-dot")
    .attr("cx", d => x(d.year)).attr("cy", d => y(d.value))
    .attr("r", d => d.year === peak?.year ? 6.5 : 4.3)
    .attr("data-peak", d => d.year === peak?.year ? "true" : "false");
  accessibleMarks(dots, d => `${d.year}: ${formatNumber(d.value)} ${label}`);

  const endpoints = [data[0], data.at(-1)].filter(Boolean);
  svg.selectAll(".endpoint-label").data(endpoints).join("text").attr("class", "endpoint-label")
    .attr("x", (d, i) => x(d.year) + (i === 0 ? 7 : -7))
    .attr("y", (d, i) => y(d.value) + (i === 0 ? -10 : 20))
    .attr("text-anchor", (_, i) => i === 0 ? "start" : "end")
    .text(d => `${d.year} · ${formatNumber(d.value)}`);
}
