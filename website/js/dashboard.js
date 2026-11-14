import {
  loadData,
  yearsIn,
  trendData,
  roadData,
  ageSexData,
  stateData,
  firstNationsData,
} from "./data.js";
import { formatNumber, formatPercent, observeResize } from "./a11y.js";
import { renderTrendChart } from "./charts/trend-chart.js";
import { renderRoadUserDonut } from "./charts/road-user-donut.js";
import { renderAgeSexChart } from "./charts/age-sex-chart.js";
import { renderStateRankingChart } from "./charts/state-ranking-chart.js";
import { renderStateHeatmap } from "./charts/state-heatmap.js";
import { renderFirstNationsChart } from "./charts/first-nations-chart.js";
import { renderFindingsTable } from "./findings.js";

// This file is the dashboard controller. Individual chart drawing code lives
// in website/js/charts so each visualisation can be explained independently.
const state = {
  rows: [],
  metric: "hospitalisations",
  startYear: 2011,
  endYear: 2021,
  page: "overview",
};

const metricLabel = () =>
  state.metric === "bed_days" ? "bed-days" : "hospitalisations";

function updateTrendStory(trend) {
  const label = metricLabel();

  const first = trend[0];
  const last = trend.at(-1);
  const change = first?.value ? last.value / first.value - 1 : 0;
  document.querySelector("#trend-insight").textContent = trend.length > 1
    ? `${Math.abs(change * 100).toFixed(1)}% ${change >= 0 ? "increase" : "decrease"} from ${first.year} to ${last.year}`
    : `${formatNumber(first?.value ?? 0)} ${label} in ${first?.year ?? "the selected year"}`;
}

function updateChartStories(road, age, states, firstNations, label) {
  const roadTotal = d3.sum(road, d => d.value);
  const roadLeader = road[0];
  document.querySelector("#road-insight").textContent = roadLeader
    ? `${roadLeader.road_user} leads with ${formatPercent(roadLeader.value / roadTotal)} of the selected road-user total.`
    : "No road-user records for this selection.";

  const ageLeader = d3.greatest(age, d => d.value);
  document.querySelector("#age-insight").textContent = ageLeader
    ? `${ageLeader.sex}, age ${ageLeader.age_group}, records the largest total at ${formatNumber(ageLeader.value)} ${label}.`
    : "No age and gender records for this selection.";

  const statusTotals = d3.rollup(
    firstNations,
    values => d3.sum(values, d => d.value),
    d => d.first_nations_status,
  );
  const profileRows = d3.groups(firstNations, d => d.age_group).map(([ageGroup, values]) => {
    const shares = values.map(d => ({
      status: d.first_nations_status,
      share: d.value / (statusTotals.get(d.first_nations_status) || 1),
    }));
    return {
      ageGroup,
      gap: shares.length > 1 ? Math.abs(shares[0].share - shares[1].share) : 0,
    };
  });
  const largestGap = d3.greatest(profileRows, d => d.gap);
  document.querySelector("#fn-insight").textContent = largestGap
    ? `The largest profile difference occurs at age ${largestGap.ageGroup}: ${(largestGap.gap * 100).toFixed(1)} percentage points.`
    : "No First Nations profile comparison for this selection.";

  const stateTotals = d3.rollups(
    states,
    values => d3.sum(values, d => d.value),
    d => d.state,
  ).map(([stateName, value]) => ({ state: stateName, value }));
  const stateLeader = d3.greatest(stateTotals, d => d.value);
  document.querySelector("#state-insight").textContent = stateLeader
    ? `${stateLeader.state} records the largest selected-period total: ${formatNumber(stateLeader.value)} ${label}.`
    : "No state or territory records for this selection.";

  const peakCell = d3.greatest(states, d => d.value);
  document.querySelector("#heat-insight").textContent = peakCell
    ? `${peakCell.state} in ${peakCell.year} is the strongest state-year cell at ${formatNumber(peakCell.value)} ${label}.`
    : "No state-year records for this selection.";
}

function render() {
  const trend = trendData(state.rows, state.metric, state.startYear, state.endYear);
  const road = roadData(state.rows, state.metric, state.startYear, state.endYear);
  const age = ageSexData(state.rows, state.metric, state.startYear, state.endYear);
  const states = stateData(state.rows, state.metric, state.startYear, state.endYear);
  const firstNations = firstNationsData(
    state.rows,
    state.metric,
    state.startYear,
    state.endYear,
  );
  const label = metricLabel();

  updateTrendStory(trend);
  updateChartStories(road, age, states, firstNations, label);
  renderTrendChart(trend, label);
  renderRoadUserDonut(road, label);
  renderAgeSexChart(age, label);
  renderStateRankingChart(states, label);
  renderStateHeatmap(states, label);
  renderFirstNationsChart(firstNations, label);
  renderFindingsTable(state.rows, state.startYear, state.endYear);

  document.querySelector("#dashboard-status").textContent = state.page === "findings"
    ? `Comparing hospitalisations and corrected bed-days from ${state.startYear} to ${state.endYear}.`
    : `Showing ${label} from ${state.startYear} to ${state.endYear}.`;
}

function populateYears(years) {
  ["#dashboard-start", "#dashboard-end"].forEach(selector => {
    const select = document.querySelector(selector);
    select.replaceChildren(...years.map(year => new Option(year, year)));
  });
  document.querySelector("#dashboard-start").value = state.startYear;
  document.querySelector("#dashboard-end").value = state.endYear;
}

function bindControls() {
  const tabs = [...document.querySelectorAll("[data-dashboard-page]")];

  const activatePage = page => {
    state.page = page;
    tabs.forEach(tab => {
      const active = tab.dataset.dashboardPage === page;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll("[data-page-panel]").forEach(panel => {
      const active = panel.dataset.pagePanel === page;
      panel.hidden = !active;
      panel.classList.toggle("active", active);
    });
    document.querySelector("#dashboard-controls").classList.toggle("findings-mode", page === "findings");
    requestAnimationFrame(render);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activatePage(tab.dataset.dashboardPage));
    tab.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      activatePage(tabs[nextIndex].dataset.dashboardPage);
    });
  });

  document.querySelectorAll('input[name="dashboard-metric"]').forEach(input => {
    input.addEventListener("change", event => {
      state.metric = event.target.value;
      render();
    });
  });

  document.querySelector("#dashboard-start").addEventListener("change", event => {
    state.startYear = Math.min(Number(event.target.value), state.endYear);
    event.target.value = state.startYear;
    render();
  });

  document.querySelector("#dashboard-end").addEventListener("change", event => {
    state.endYear = Math.max(Number(event.target.value), state.startYear);
    event.target.value = state.endYear;
    render();
  });

  document.querySelector("#dashboard-reset").addEventListener("click", () => {
    const years = yearsIn(state.rows);
    state.metric = "hospitalisations";
    state.startYear = years[0];
    state.endYear = years.at(-1);
    document.querySelector('input[value="hospitalisations"]').checked = true;
    populateYears(years);
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
    observeResize([...document.querySelectorAll(".dashboard-chart")], render);
  } catch (error) {
    console.error(error);
    const banner = document.querySelector("#error-banner");
    banner.hidden = false;
    banner.textContent =
      "The dashboard data could not be loaded. Run the website through a local web server and confirm the processed CSV is available.";
  }
}

initialise();
