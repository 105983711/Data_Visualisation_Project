/*
 * Application entry point and interaction state.
 * OpenAI Codex assisted with this implementation from prompts requesting a
 * D3 data story, multiple purposeful chart types and WCAG-informed access.
 * The project team must understand, test and acknowledge this assistance.
 */

import { loadData, yearsIn, trendData, roadData, ageSexData, stateData, firstNationsData } from "./data.js";
import { renderTrend, renderRoad, renderAgeSex, renderState, renderFirstNations } from "./charts.js";
import { observeResize } from "./a11y.js";

const state = { rows: [], metric: "hospitalisations", startYear: 2011, endYear: 2021, roadLimit: 6, fnMode: "share" };
const chartContainers = [...document.querySelectorAll(".chart")];

function selectedMetricLabel() {
  return state.metric === "bed_days" ? "bed-days" : "hospitalisations";
}

function render() {
  renderTrend(document.querySelector("#trend-chart"), trendData(state.rows, state.metric, state.startYear, state.endYear), state.metric, document.querySelector("#trend-table"), document.querySelector("#trend-summary"));
  renderRoad(document.querySelector("#road-chart"), roadData(state.rows, state.metric, state.startYear, state.endYear), state.metric, state.roadLimit, document.querySelector("#road-table"), document.querySelector("#road-summary"));
  renderAgeSex(document.querySelector("#age-chart"), ageSexData(state.rows, state.metric, state.startYear, state.endYear), state.metric, document.querySelector("#age-table"), document.querySelector("#age-summary"));
  renderState(document.querySelector("#state-chart"), stateData(state.rows, state.metric, state.startYear, state.endYear), state.metric, document.querySelector("#state-table"), document.querySelector("#state-summary"));
  renderFirstNations(document.querySelector("#fn-chart"), firstNationsData(state.rows, state.metric, state.startYear, state.endYear), state.metric, state.fnMode, document.querySelector("#fn-table"), document.querySelector("#fn-summary"));
  document.querySelector("#filter-status").textContent = `Showing ${selectedMetricLabel()} from ${state.startYear} to ${state.endYear}.`;
}

function populateYears(years) {
  const start = document.querySelector("#start-year");
  const end = document.querySelector("#end-year");
  [start, end].forEach(select => {
    select.replaceChildren(...years.map(year => new Option(year, year)));
  });
  start.value = state.startYear;
  end.value = state.endYear;
}

function bindControls() {
  document.querySelectorAll('input[name="metric"]').forEach(input => input.addEventListener("change", event => {
    state.metric = event.target.value;
    render();
  }));

  document.querySelector("#start-year").addEventListener("change", event => {
    state.startYear = Math.min(Number(event.target.value), state.endYear);
    event.target.value = state.startYear;
    render();
  });
  document.querySelector("#end-year").addEventListener("change", event => {
    state.endYear = Math.max(Number(event.target.value), state.startYear);
    event.target.value = state.endYear;
    render();
  });
  document.querySelector("#road-limit").addEventListener("change", event => {
    state.roadLimit = Number(event.target.value);
    render();
  });
  document.querySelectorAll("[data-fn-mode]").forEach(button => button.addEventListener("click", () => {
    state.fnMode = button.dataset.fnMode;
    document.querySelectorAll("[data-fn-mode]").forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    render();
  }));
  document.querySelector("#reset-filters").addEventListener("click", () => {
    state.metric = "hospitalisations";
    state.startYear = 2011;
    state.endYear = 2021;
    state.roadLimit = 6;
    document.querySelector('input[value="hospitalisations"]').checked = true;
    document.querySelector("#start-year").value = 2011;
    document.querySelector("#end-year").value = 2021;
    document.querySelector("#road-limit").value = 6;
    render();
  });
}

async function initialise() {
  try {
    state.rows = await loadData();
    const years = yearsIn(state.rows);
    state.startYear = years[0];
    state.endYear = years.at(-1);
    populateYears(years);
    bindControls();
    render();
    observeResize(chartContainers, render);
  } catch (error) {
    console.error(error);
    const banner = document.querySelector("#error-banner");
    banner.hidden = false;
    banner.textContent = "The visualisation data could not be loaded. Run this website through a local web server and confirm the CSV exists in website/data/.";
  }
}

initialise();
