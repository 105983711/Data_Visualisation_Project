// Functions shared by several dashboard charts.
export const CHART_COLOURS = ["#b84a14", "#075a67", "#d19a13", "#5f7f88", "#e7a47c", "#88c8c2"];

export const axisFormat = value => d3.format("~s")(value).replace("G", "B");

export function addMeasureLabel(svg, width, height, label) {
  const displayLabel = label === "bed-days" ? "Bed-days" : "Hospitalisations";
  svg.append("text")
    .attr("class", "chart-measure-label")
    .attr("x", width / 2)
    .attr("y", height - 4)
    .attr("text-anchor", "middle")
    .attr("aria-hidden", "true")
    .text(displayLabel);
}

export function addGridYAxis(svg, y, margin, width, tickFormat = axisFormat) {
  svg.append("g").attr("class", "grid").attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(4).tickSize(-(width - margin.left - margin.right)).tickFormat(""));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(4).tickFormat(tickFormat));
}
