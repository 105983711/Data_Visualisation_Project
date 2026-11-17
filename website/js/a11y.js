const tooltip = document.querySelector("#chart-tooltip");
const announcer = document.querySelector("#tooltip-announcer");

export const formatNumber = d3.format(",.0f");
export const formatPercent = d3.format(".1%");

export function chartSize(container, preferredHeight = 460) {
  const width = Math.max(320, Math.min(1100, container.clientWidth || 900));
  const availableHeight = container.clientHeight || preferredHeight;
  const height = width < 560
    ? Math.max(360, Math.min(560, availableHeight))
    : Math.max(preferredHeight, Math.min(650, availableHeight));
  return { width, height };
}

export function createSvg(container, { id, title, description, height = 460 }) {
  container.replaceChildren();
  const { width, height: responsiveHeight } = chartSize(container, height);
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${responsiveHeight}`)
    .attr("width", width)
    .attr("height", responsiveHeight)
    .attr("role", "img")
    .attr("aria-labelledby", `${titleId} ${descriptionId}`);
  svg.append("title").attr("id", titleId).text(title);
  svg.append("desc").attr("id", descriptionId).text(description);
  return { svg, width, height: responsiveHeight };
}

export function showTooltip(event, text) {
  tooltip.textContent = text;
  tooltip.hidden = false;
  announcer.textContent = text;
  const rect = event.currentTarget.getBoundingClientRect();
  const left = Math.min(window.innerWidth - 280, Math.max(8, rect.left + rect.width / 2));
  const top = Math.max(8, rect.top - 72);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

export function hideTooltip() {
  tooltip.hidden = true;
}

export function accessibleMarks(selection, label) {
  const nodes = selection.nodes();
  const highlight = activeNode => {
    selection
      .classed("context-muted", function() { return this !== activeNode; })
      .classed("context-selected", function() { return this === activeNode; });
  };
  const clearHighlight = () => selection
    .classed("context-muted", false)
    .classed("context-selected", false);
  selection
    .attr("class", function() { return `${this.getAttribute("class") || ""} mark`.trim(); })
    .attr("tabindex", 0)
    .attr("role", "graphics-symbol")
    .attr("aria-label", label)
    .on("mouseenter", function(event, d) {
      highlight(this);
      showTooltip(event, label(d));
    })
    .on("mouseleave", function() {
      clearHighlight();
      hideTooltip();
    })
    .on("focus", function(event, d) {
      highlight(this);
      showTooltip(event, label(d));
    })
    .on("blur", function() {
      clearHighlight();
      hideTooltip();
    })
    .on("keydown", function(event) {
      const index = nodes.indexOf(this);
      if (["ArrowRight", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        nodes[(index + 1) % nodes.length]?.focus();
      }
      if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        nodes[(index - 1 + nodes.length) % nodes.length]?.focus();
      }
    });
  return selection;
}

export function renderTable(target, rows, columns) {
  const root = d3.select(target);
  root.selectAll("*").remove();
  const wrap = root.append("div").attr("class", "table-wrap");
  const table = wrap.append("table");
  table.append("caption").attr("class", "sr-only").text("Values shown in the chart");
  table.append("thead").append("tr").selectAll("th")
    .data(columns).join("th").attr("scope", "col").text(d => d.label);
  const bodyRows = table.append("tbody").selectAll("tr").data(rows).join("tr");
  bodyRows.selectAll("td").data(row => columns.map(column => ({ column, row }))).join("td")
    .text(d => d.column.format ? d.column.format(d.row[d.column.key], d.row) : d.row[d.column.key]);
}

export function emptyChart(container, message) {
  container.replaceChildren();
  const p = document.createElement("p");
  p.className = "empty-state";
  p.textContent = message;
  container.appendChild(p);
}

export function observeResize(elements, callback) {
  let timer;
  const observer = new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(callback, 120);
  });
  elements.forEach(element => observer.observe(element));
  return observer;
}
