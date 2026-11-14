// Research question: Which road-user categories recorded the largest totals?
import { createSvg, accessibleMarks, formatNumber, formatPercent } from "../a11y.js";
import { addMeasureLabel, axisFormat, CHART_COLOURS } from "./chart-utils.js";

function prepareDonutData(rows) {
  const total = d3.sum(rows, d => d.value);
  const top = rows.slice(0, 5);
  const other = d3.sum(rows.slice(5), d => d.value);
  return { total, items: other ? [...top, { road_user: "Other categories", value: other }] : top };
}

export function renderRoadUserDonut(rows, label) {
  const container = document.querySelector("#dashboard-road");
  const { total, items } = prepareDonutData(rows);
  const { svg, width, height } = createSvg(container, {
    id: "dashboard-road-user",
    title: `Road-user share of ${label}`,
    description: "Donut chart of the five largest road-user categories and all remaining categories combined.",
    height: 315
  });
  const cx = width < 520 ? width * .35 : width * .32;
  addMeasureLabel(svg, width, height, label);
  const cy = height / 2 + 6;
  const radius = Math.min(width * .23, height * .36);
  const pie = d3.pie().sort(null).value(d => d.value)(items);
  const arc = d3.arc().innerRadius(radius * .58).outerRadius(radius);
  const slices = svg.append("g").attr("transform", `translate(${cx},${cy})`).selectAll("path").data(pie).join("path")
    .attr("fill", (_, i) => CHART_COLOURS[i]).attr("stroke", "#fffdf8").attr("stroke-width", 2).attr("d", arc);
  accessibleMarks(slices, d => `${d.data.road_user}: ${formatNumber(d.data.value)} ${label}, ${formatPercent(d.data.value / total)}`);
  svg.append("text").attr("class", "donut-centre-main").attr("x", cx).attr("y", cy - 2).text(formatNumber(total));
  svg.append("text").attr("class", "donut-centre-sub").attr("x", cx).attr("y", cy + 16).text(label);
  const legendX = width < 520 ? width * .62 : width * .58;
  const legend = svg.append("g").attr("class", "legend road-user-legend").attr("transform", `translate(${legendX},${Math.max(12, cy - items.length * 22)})`);
  const entry = legend.selectAll("g").data(items).join("g").attr("transform", (_, i) => `translate(0,${i * 44})`);
  entry.append("rect").attr("width", 18).attr("height", 18).attr("rx", 2).attr("fill", (_, i) => CHART_COLOURS[i]);
  entry.append("text").attr("x", 25).attr("y", 9).text(d => d.road_user);
  entry.append("text").attr("x", 25).attr("y", 27).attr("fill", "#5d696c").text(d => `${formatPercent(d.value / total)} · ${axisFormat(d.value)}`);
}
