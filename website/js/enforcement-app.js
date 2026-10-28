import { loadEnforcementData, view } from "./enforcement-data.js";
import { renderDetectionTrend, renderDetectionMix, renderStateRates, renderAgeProfile } from "./enforcement-charts.js";
import { observeResize } from "./a11y.js";

const state = { rows: [], trendMetric: "Speeding", rateMetric: "Speeding" };
const chartContainers = [...document.querySelectorAll(".chart")];

function render() {
  const annual = view(state.rows, "Annual detection");
  renderDetectionTrend(document.querySelector("#enforcement-trend-chart"), annual, state.trendMetric, document.querySelector("#enforcement-trend-table"), document.querySelector("#enforcement-trend-summary"));
  renderDetectionMix(document.querySelector("#detection-mix-chart"), annual, document.querySelector("#detection-mix-table"), document.querySelector("#detection-mix-summary"));
  renderStateRates(document.querySelector("#state-rate-chart"), view(state.rows, "State rates 2024"), state.rateMetric, document.querySelector("#state-rate-table"), document.querySelector("#state-rate-summary"));
  renderAgeProfile(document.querySelector("#age-profile-chart"), view(state.rows, "Age profile 2024"), document.querySelector("#age-profile-table"), document.querySelector("#age-profile-summary"));
}

function bindControls() {
  document.querySelector("#trend-metric").addEventListener("change", event => { state.trendMetric = event.target.value; render(); });
  document.querySelector("#rate-metric").addEventListener("change", event => { state.rateMetric = event.target.value; render(); });
}

async function initialise() {
  try {
    state.rows = await loadEnforcementData();
    bindControls();
    render();
    observeResize(chartContainers, render);
  } catch (error) {
    console.error(error);
    const banner = document.querySelector("#error-banner");
    banner.hidden = false;
    banner.textContent = "The enforcement data could not be loaded. Run this website through a local web server and confirm website/data/enforcement_views.csv exists.";
  }
}

initialise();
