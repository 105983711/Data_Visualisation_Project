import {
  trendData,
  roadData,
  ageSexData,
  stateData,
  firstNationsData,
} from "./data.js";
import { formatNumber, formatPercent } from "./a11y.js";


function summarise(rows, metric, startYear, endYear) {
  const trend = trendData(rows, metric, startYear, endYear);
  const road = roadData(rows, metric, startYear, endYear);
  const age = ageSexData(rows, metric, startYear, endYear);
  const states = stateData(rows, metric, startYear, endYear);
  const firstNations = firstNationsData(rows, metric, startYear, endYear);

  const first = trend[0];
  const last = trend.at(-1);
  const peak = d3.greatest(trend, d => d.value);
  const roadTotal = d3.sum(road, d => d.value);
  const roadLeader = road[0];
  const ageLeader = d3.greatest(age, d => d.value);

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
      shares,
      gap: shares.length > 1 ? Math.abs(shares[0].share - shares[1].share) : 0,
    };
  });
  const largestGap = d3.greatest(profileRows, d => d.gap);

  const stateTotals = d3.rollups(
    states,
    values => d3.sum(values, d => d.value),
    d => d.state,
  ).map(([stateName, value]) => ({ state: stateName, value }));
  const stateLeader = d3.greatest(stateTotals, d => d.value);
  const peakCell = d3.greatest(states, d => d.value);

  return { first, last, peak, roadLeader, roadTotal, ageLeader, largestGap, stateLeader, peakCell };
}


function trendFinding(summary, label) {
  if (!summary.first || !summary.last) return "No records for this period.";
  const change = summary.first.value
    ? summary.last.value / summary.first.value - 1
    : 0;
  return `<strong>${formatNumber(summary.first.value)} to ${formatNumber(summary.last.value)}</strong> (${Math.abs(change * 100).toFixed(1)}% ${change >= 0 ? "increase" : "decrease"}). Peak: ${summary.peak.year}, ${formatNumber(summary.peak.value)} ${label}.`;
}


function roadFinding(summary, label) {
  if (!summary.roadLeader) return "No records for this period.";
  return `<strong>${summary.roadLeader.road_user}</strong>: ${formatNumber(summary.roadLeader.value)} ${label}, ${formatPercent(summary.roadLeader.value / summary.roadTotal)} of the road-user total.`;
}


function ageFinding(summary, label) {
  if (!summary.ageLeader) return "No records for this period.";
  return `<strong>${summary.ageLeader.sex}, age ${summary.ageLeader.age_group}</strong>: ${formatNumber(summary.ageLeader.value)} ${label}.`;
}


function profileFinding(summary) {
  if (!summary.largestGap) return "No profile comparison for this period.";
  return `<strong>Age ${summary.largestGap.ageGroup}</strong> has the largest within-status profile gap: ${(summary.largestGap.gap * 100).toFixed(1)} percentage points.`;
}


function stateFinding(summary, label) {
  if (!summary.stateLeader) return "No records for this period.";
  return `<strong>${summary.stateLeader.state}</strong>: ${formatNumber(summary.stateLeader.value)} ${label}.`;
}


function cellFinding(summary, label) {
  if (!summary.peakCell) return "No records for this period.";
  return `<strong>${summary.peakCell.state}, ${summary.peakCell.year}</strong>: ${formatNumber(summary.peakCell.value)} ${label}.`;
}


export function renderFindingsTable(rows, startYear, endYear) {
  const hospitalisations = summarise(rows, "hospitalisations", startYear, endYear);
  const bedDays = summarise(rows, "bed_days", startYear, endYear);
  const sameRoadLeader = hospitalisations.roadLeader?.road_user === bedDays.roadLeader?.road_user;
  const sameAgeLeader = hospitalisations.ageLeader?.age_group === bedDays.ageLeader?.age_group
    && hospitalisations.ageLeader?.sex === bedDays.ageLeader?.sex;
  const sameStateLeader = hospitalisations.stateLeader?.state === bedDays.stateLeader?.state;

  const rowsToShow = [
    {
      chart: "01 National trend",
      question: "How did the recorded burden change?",
      hospitalisations: trendFinding(hospitalisations, "hospitalisations"),
      bedDays: trendFinding(bedDays, "bed-days"),
      interpretation: hospitalisations.peak?.year === bedDays.peak?.year
        ? "Both measures peak in the same year for this selection."
        : "The measures peak in different years, so admissions and occupied hospital time do not move identically.",
    },
    {
      chart: "02 Road-user composition",
      question: "Who accounts for the largest share?",
      hospitalisations: roadFinding(hospitalisations, "hospitalisations"),
      bedDays: roadFinding(bedDays, "bed-days"),
      interpretation: sameRoadLeader
        ? "The same road-user category leads both measures, although its share differs."
        : "Different road-user categories lead the two measures.",
    },
    {
      chart: "03 Age and gender",
      question: "Which age and gender group has the largest total?",
      hospitalisations: ageFinding(hospitalisations, "hospitalisations"),
      bedDays: ageFinding(bedDays, "bed-days"),
      interpretation: sameAgeLeader
        ? "The same age and gender group leads both recorded totals."
        : "The leading age and gender group changes with the selected measure.",
    },
    {
      chart: "04 First Nations profiles",
      question: "Where do the age profiles differ most?",
      hospitalisations: profileFinding(hospitalisations),
      bedDays: profileFinding(bedDays),
      interpretation: "These are shares within each status group. They describe profile shape and do not compare population risk.",
    },
    {
      chart: "05 State ranking",
      question: "Which jurisdiction records the largest total?",
      hospitalisations: stateFinding(hospitalisations, "hospitalisations"),
      bedDays: stateFinding(bedDays, "bed-days"),
      interpretation: sameStateLeader
        ? "The same jurisdiction leads both selected-period totals."
        : "The leading jurisdiction changes with the selected measure.",
    },
    {
      chart: "06 State pattern over time",
      question: "Where and when is the strongest state-year cell?",
      hospitalisations: cellFinding(hospitalisations, "hospitalisations"),
      bedDays: cellFinding(bedDays, "bed-days"),
      interpretation: "The strongest state-year cell can differ because bed-days reflect time in hospital as well as the number of admissions.",
    },
  ];

  const tbody = document.querySelector("#findings-table-body");
  if (!tbody) return;
  tbody.innerHTML = rowsToShow.map(row => `
    <tr>
      <th scope="row">${row.chart}<span>${row.question}</span></th>
      <td>${row.hospitalisations}</td>
      <td>${row.bedDays}</td>
      <td>${row.interpretation}</td>
    </tr>
  `).join("");
}
