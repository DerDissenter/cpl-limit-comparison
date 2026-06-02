let comparisonChart = null;
let playerCounter = 0;
const MAX_PLAYER_AGE = 40;

const SKILL_NAMES = [
  "Aim",
  "Handling",
  "Quickness",
  "Determination",
  "Awareness",
  "Teamplay",
  "Gamesense",
  "Movement"
];

const MOBILE_ALIAS = {
  AIM: "Aim",
  HND: "Handling",
  QCK: "Quickness",
  DET: "Determination",
  AWA: "Awareness",
  TMP: "Teamplay",
  GMS: "Gamesense",
  MOV: "Movement"
};

const NORMAL_AGE_DECAY = {
  21: 30,
  22: 30,
  23: 30,
  24: 30,
  25: 28,
  26: 28,
  27: 28,
  28: 22,
  29: 15,
  30: 5,
  31: -1,
  32: -7,
  33: -15,
  34: -22,
  35: -30,
  36: -38,
  37: -45,
  38: -52,
  39: -60,
  40: -66
};

const ANALYSIS_AGE_DECAY = {
  21: 64,
  22: 64,
  23: 64,
  24: 64,
  25: 63,
  26: 63,
  27: 63,
  28: 56,
  29: 49,
  30: 40,
  31: 33,
  32: 26,
  33: 19,
  34: 12,
  35: 3,
  36: -3,
  37: -10,
  38: -17,
  39: -24,
  40: -31
};

const maxAgeMarkerPlugin = {
  id: "maxAgeMarker",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    ctx.save();
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);

      (dataset.maxAgeIndexes || []).forEach(dataIndex => {
        const point = dataset.projectionPoints?.[dataIndex];
        if (!point?.maxAgeReached) return;

        const element = meta.data[dataIndex];
        if (!element) return;

        const { x, y } = element.getProps(["x", "y"], true);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;

        ctx.fillText("\u2620\uFE0F", x, y);
      });
    });

    ctx.restore();
  }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeSkillName(value) {
  const clean = String(value || "").trim();
  return MOBILE_ALIAS[clean.toUpperCase()] || clean;
}

function parsePlayerText(text) {
  const lines = text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const parsedSkills = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const normalizedLine = normalizeSkillName(currentLine);

    const inlineMatch = currentLine.match(/^([A-Za-z]+)\s+(\d+)\s*\/\s*(\d+|\?)$/i);

    if (inlineMatch) {
      const skillName = normalizeSkillName(inlineMatch[1]);

      if (SKILL_NAMES.includes(skillName)) {
        parsedSkills.push({
          name: skillName,
          value: Number(inlineMatch[2]),
          max: inlineMatch[3] === "?" ? null : Number(inlineMatch[3])
        });
      }

      continue;
    }

    if (SKILL_NAMES.includes(normalizedLine)) {
      const valueLine = lines[i + 1] || "";
      const maxLine = lines[i + 2] || "";

      const value = Number.parseInt(valueLine, 10);
      const rawMax = maxLine.replace("/", "").trim();
      const max = /^\d+$/.test(rawMax) ? Number(rawMax) : null;

      parsedSkills.push({
        name: normalizedLine,
        value: Number.isNaN(value) ? 0 : value,
        max
      });
    }
  }

  const playerName =
    lines.find(line => {
      const normalized = normalizeSkillName(line);
      return (
        !SKILL_NAMES.includes(normalized) &&
        !/^\d+$/.test(line) &&
        !/^\/?\d+|\?$/.test(line) &&
        !/yo/i.test(line)
      );
    }) || "Unknown Player";

  return {
    playerName,
    playerAge: lines.find(line => /yo/i.test(line)) || "",
    skills: parsedSkills
  };
}

function parseAgeString(ageText) {
  if (!ageText || typeof ageText !== "string") {
    return { age: null, birthdayDay: null };
  }

  const ageMatch = ageText.match(/(\d+)\s*yo/i);
  const dayMatch = ageText.match(/day\s*(\d+)/i);

  return {
    age: ageMatch ? Number(ageMatch[1]) : null,
    birthdayDay: dayMatch ? Number(dayMatch[1]) : null
  };
}

function getSelectedSkills() {
  return Array.from(document.querySelectorAll(".skill-checkbox:checked"))
    .map(checkbox => checkbox.value);
}

function useSkillWeights() {
  return document.getElementById("use-skill-weights")?.checked || false;
}

function shouldApplyAgeDecay() {
  return document.getElementById("apply-age-decay")?.checked || false;
}

function shouldUseAnalysisFeature() {
  return document.getElementById("use-analysis-feature")?.checked || false;
}

function getSkillWeights() {
  const weights = {};

  document.querySelectorAll(".skill-weight").forEach(input => {
    const skillName = input.dataset.skill;
    const value = parseDecimalInput(input.value);

    weights[skillName] = value > 0 ? value : 0;
  });

  return weights;
}
function parseDecimalInput(value) {
  const normalized = String(value || "")
    .trim()
    .replace(",", ".");

  const number = Number(normalized);

  return Number.isNaN(number) ? 0 : number;
}

function getHeartBonusByGames(games, loyal = false) {
  const multiplier = loyal ? 0.75 : 1;

  const tinyReq = Math.floor(50 * multiplier);
  const smallReq = Math.floor(100 * multiplier);
  const bigReq = Math.floor(200 * multiplier);
  const goldReq = Math.floor(400 * multiplier);
  const platReq = Math.floor(800 * multiplier);

  if (games >= platReq) return 0.08;
  if (games >= goldReq) return 0.05;
  if (games >= bigReq) return 0.03;
  if (games >= smallReq) return 0.01;
  if (games >= tinyReq) return 0.005;
  return 0;
}

function getHeartBonus(games, mode, loyal = false) {
  if (mode === "constant4") return 0.04;
  return getHeartBonusByGames(games, loyal);
}

function getSelectedLimitAverage(player, selectedSkills, weights = {}, weightsEnabled = false, abilities = {}) {
  let weightedSum = 0;
  let totalWeight = 0;

  selectedSkills.forEach(skillName => {
    const skill = player.skills.find(item => item.name === skillName);

    if (!skill || skill.max === null || Number.isNaN(Number(skill.max))) {
      return;
    }

    const rawLimit = Number(skill.max);
    const modifier = getAbilityModifierForSkill(skillName, abilities);
    const adjustedLimit = rawLimit * (1 + modifier);

    const weight = weightsEnabled ? Number(weights[skillName] || 0) : 1;

    if (weight <= 0) return;

    weightedSum += adjustedLimit * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) return 0;

  return weightedSum / totalWeight;
}

function getMissingLimits(player, selectedSkills) {
  return selectedSkills.filter(skillName => {
    const skill = player.skills.find(item => item.name === skillName);
    return !skill || skill.max === null || Number.isNaN(Number(skill.max));
  });
}

function getTotalLimit(player) {
  return player.skills.reduce((total, skill) => {
    const limit = Number(skill.max);
    return total + (Number.isNaN(limit) || skill.max === null ? 0 : limit);
  }, 0);
}

function getAgeNumberAtSeason(playerAgeText, seasonOffset) {
  const { age } = parseAgeString(playerAgeText);
  return age === null ? null : age + seasonOffset;
}

function isPastMaxAge(playerAgeText, seasonOffset) {
  const age = getAgeNumberAtSeason(playerAgeText, seasonOffset);
  return age !== null && age > MAX_PLAYER_AGE;
}

function getAgeDecayValue(age, useAnalysisFeature = false) {
  const table = useAnalysisFeature ? ANALYSIS_AGE_DECAY : NORMAL_AGE_DECAY;
  return table[age] ?? 0;
}

function getAgeDecayDetails(player, seasonOffset, applyAgeDecay = false, useAnalysisFeature = false) {
  const age = getAgeNumberAtSeason(player.playerAge, seasonOffset);
  const totalLimit = getTotalLimit(player);
  const tableValue = age === null ? 0 : getAgeDecayValue(age, useAnalysisFeature);
  const absoluteDecay = applyAgeDecay && tableValue < 0 ? Math.abs(tableValue) : 0;
  const decayPercent = totalLimit > 0 ? absoluteDecay / totalLimit : 0;

  return {
    age,
    totalLimit,
    tableValue,
    absoluteDecay,
    decayPercent
  };
}

function getAgeAtSeason(playerAgeText, seasonOffset) {
  const { age, birthdayDay } = parseAgeString(playerAgeText);

  if (age === null) return "unknown";

  const ageAtSeason = age + seasonOffset;

  if (birthdayDay !== null) {
    return `${ageAtSeason}yo (day ${birthdayDay})`;
  }

  return `${ageAtSeason}yo`;
}

function buildProjection(
  player,
  selectedSkills,
  startGames,
  heartMode,
  gamesPerSeason,
  seasonCount,
  loyal = false,
  weights = {},
  weightsEnabled = false,
  abilities = {},
  applyAgeDecay = false,
  useAnalysisFeature = false
) {
  const baseLimit = getSelectedLimitAverage(player, selectedSkills, weights, weightsEnabled, abilities);
  const result = [];

  for (let season = 0; season <= seasonCount; season++) {
    if (isPastMaxAge(player.playerAge, season)) {
      break;
    }

    const games = startGames + season * gamesPerSeason;
    const heartBonus = getHeartBonus(games, heartMode, loyal);
    const scoreBeforeDecay = baseLimit * (1 + heartBonus);
    const ageDecay = getAgeDecayDetails(player, season, applyAgeDecay, useAnalysisFeature);
    const maxAgeReached = ageDecay.age === MAX_PLAYER_AGE;
    const effectiveLimit = scoreBeforeDecay * (1 - ageDecay.decayPercent);

    result.push({
      season,
      games,
      baseLimit,
      heartBonus,
      scoreBeforeDecay,
      ageDecay,
      maxAgeReached,
      effectiveLimit,
      loyal
    });
  }

  return result;
}

function getBestPlayerAtSeason(players, seasonIndex) {
  return players
    .map(player => {
      const point = player.projection.find(item => item.season === seasonIndex);

      return point
        ? {
            player,
            value: point.effectiveLimit
          }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.value - a.value)[0];
}

function getLeaderChanges(players) {
  const changes = [];
  let previousLeader = null;

  const lastSeason = getLastProjectionSeason(players);

  for (let season = 0; season <= lastSeason; season++) {
    const leader = getBestPlayerAtSeason(players, season);

    if (!leader) continue;

    if (!previousLeader) {
      previousLeader = leader.player.playerName;
      continue;
    }

    if (leader.player.playerName !== previousLeader) {
      changes.push({
        season,
        playerName: leader.player.playerName,
        value: leader.value
      });

      previousLeader = leader.player.playerName;
    }
  }

  return changes;
}

function getLastProjectionSeason(players) {
  return Math.max(
    0,
    ...players.map(player => player.projection[player.projection.length - 1]?.season ?? 0)
  );
}

function getProjectionPoint(player, season) {
  return player.projection.find(point => point.season === season) || null;
}

function renderChart(players, weightsEnabled = false, applyAgeDecay = false, useAnalysisFeature = false) {
  const canvas = document.getElementById("comparison-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (comparisonChart) {
    comparisonChart.destroy();
  }

  const lastSeason = getLastProjectionSeason(players);
  const labels = Array.from({ length: lastSeason + 1 }, (_, season) => `S${season}`);

  comparisonChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: players.map(player => {
        const projectionPoints = labels.map((label, season) => getProjectionPoint(player, season));

        return {
          label: player.playerName || "Unknown Player",
          data: projectionPoints.map(point => point ? Number(point.effectiveLimit.toFixed(2)) : null),
          projectionPoints,
          maxAgeIndexes: projectionPoints
            .map((point, index) => point?.maxAgeReached ? index : null)
            .filter(index => index !== null),
          tension: 0.25,
          spanGaps: false,
          pointRadius: context => {
            const point = context.dataset.projectionPoints?.[context.dataIndex];
            if (!point) return 0;
            return point.maxAgeReached ? 0 : 3;
          },
          pointHitRadius: context => {
            const point = context.dataset.projectionPoints?.[context.dataIndex];
            return point ? 4 : 0;
          },
          pointHoverRadius: context => {
            const point = context.dataset.projectionPoints?.[context.dataIndex];
            if (!point) return 0;
            return point.maxAgeReached ? 0 : 5;
          },
          pointStyle: context => {
            const point = context.dataset.projectionPoints?.[context.dataIndex];
            return point?.maxAgeReached ? "rectRot" : "circle";
          }
        };
      })
    },
    plugins: [maxAgeMarkerPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "nearest",
        intersect: true
      },
      plugins: {
        tooltip: {
            mode: "nearest",
            intersect: true,
            callbacks: {
                afterLabel: function(context) {
                const player = players[context.datasetIndex];
                const point = context.dataset.projectionPoints?.[context.dataIndex];

                if (!point) return [];

                return [
                `Games: ${point.games}`,
                `Age: ${getAgeAtSeason(player.playerAge, point.season)}`,
                point.maxAgeReached ? "Max age reached: line ends here" : null,
                `${weightsEnabled ? "Base Weighted Score" : "Base Limit"}: ${point.baseLimit.toFixed(2)}`,
                `Heart: ${(point.heartBonus * 100).toFixed(1)}%`,
                `Before decay: ${point.scoreBeforeDecay.toFixed(2)}`,
                `Age decay: ${applyAgeDecay ? `${point.ageDecay.absoluteDecay} total skill (${(point.ageDecay.decayPercent * 100).toFixed(2)}%)` : "Off"}`,
                `Analysis feature: ${applyAgeDecay && useAnalysisFeature ? "Yes" : "No"}`,
                `Loyal: ${player.loyal ? "Yes" : "No"}`,
                `Fragger: ${player.fragger ? "Yes" : "No"}`,
                `Tryhard: ${player.tryhard ? "Yes" : "No"}`
                ].filter(Boolean);
                }
            }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Seasons"
          }
        },
        y: {
          title: {
            display: true,
            text: `${weightsEnabled ? "Weighted Score" : "Limit"} + Heart Bonus${applyAgeDecay ? " - Age Decay" : ""}`
          }
        }
      }
    }
  });
}

function renderSummary(players, selectedSkills, weights = {}, weightsEnabled = false, applyAgeDecay = false, useAnalysisFeature = false) {
  const summary = document.getElementById("summary");
  if (!summary) return;
    const modeText = weightsEnabled ? "Weighted score" : "Equal weighting";
    const ageDecayText = applyAgeDecay
      ? `On (${useAnalysisFeature ? "analysis feature" : "normal table"})`
      : "Off";

    const weightText = weightsEnabled
    ? `<p><strong>Weights:</strong> ${selectedSkills
        .map(skill => `${escapeHtml(skill)}: ${Number(weights[skill] || 0)}`)
        .join(", ")}</p>`
    : "";
  const playerRows = players.map(player => {
    const start = player.projection[0];
    const end = player.projection[player.projection.length - 1];
    const missingLimits = getMissingLimits(player, selectedSkills);

    const warning = missingLimits.length
      ? `<br><span class="warning">Missing/ignored limits: ${escapeHtml(missingLimits.join(", "))}</span>`
      : "";

    return `
      <p>
        <strong>${escapeHtml(player.playerName || "Unknown Player")}:</strong>
        ${start.effectiveLimit.toFixed(2)} → ${end.effectiveLimit.toFixed(2)}
        ${end.maxAgeReached ? " ☠" : ""}
        <br>
        ${weightsEnabled ? "Base Weighted Score" : "Base Limit"}: ${start.baseLimit.toFixed(2)}
        <br>
        Projection: S${start.season} to S${end.season}${end.maxAgeReached ? " (max age 40 reached)" : ""}
        <br>
        Age decay: ${applyAgeDecay ? `${end.ageDecay.absoluteDecay} total skill at end (${(end.ageDecay.decayPercent * 100).toFixed(2)}%)` : "Off"}
        <br>
        Abilities:
        ${[
          player.loyal ? "Loyal" : null,
          player.fragger ? "Fragger" : null,
          player.tryhard ? "Tryhard" : null
        ].filter(Boolean).join(", ") || "None"}
        ${warning}
      </p>
    `;
  }).join("");

  const winnerAtStart = getBestPlayerAtSeason(players, 0);
  const winnerAtEnd = getBestPlayerAtSeason(players, getLastProjectionSeason(players));
  const leaderChanges = getLeaderChanges(players);

  const leaderChangeText = leaderChanges.length
    ? leaderChanges
        .map(change => `S${change.season}: ${escapeHtml(change.playerName)} takes the lead with ${change.value.toFixed(2)}`)
        .join("<br>")
    : "No lead changes in the selected timeframe.";

  summary.innerHTML = `
    <h2>Summary</h2>

    <p><strong>Compared skills:</strong> ${escapeHtml(selectedSkills.join(", "))}</p>
    <p><strong>Mode:</strong> ${modeText}</p>
    <p><strong>Age decay:</strong> ${ageDecayText}</p>
    ${weightText}

    ${playerRows}

    <p>
      <strong>Start leader:</strong>
      ${escapeHtml(winnerAtStart.player.playerName)} with ${winnerAtStart.value.toFixed(2)}
    </p>

    <p>
      <strong>End leader:</strong>
      ${escapeHtml(winnerAtEnd.player.playerName)} with ${winnerAtEnd.value.toFixed(2)}
    </p>

    <p>
      <strong>Leader changes:</strong><br>
      ${leaderChangeText}
    </p>
  `;
}

function renderDecisionSummary(players, selectedSkills, weights = {}, weightsEnabled = false, applyAgeDecay = false, useAnalysisFeature = false) {
  const summary = document.getElementById("summary");
  if (!summary) return;

  const modeText = weightsEnabled ? "Weighted score" : "Equal weighting";
  const ageDecayText = applyAgeDecay
    ? `On (${useAnalysisFeature ? "analysis feature" : "normal table"})`
    : "Off";
  const lastSeason = getLastProjectionSeason(players);
  const winnerAtStart = getBestPlayerAtSeason(players, 0);
  const winnerAtEnd = getBestPlayerAtSeason(players, lastSeason);
  const leaderChanges = getLeaderChanges(players);

  const playerStats = players.map(player => {
    const start = player.projection[0];
    const end = player.projection[player.projection.length - 1];
    const averageScore = player.projection.reduce((total, point) => total + point.effectiveLimit, 0) / player.projection.length;

    return {
      player,
      start,
      end,
      averageScore,
      delta: end.effectiveLimit - start.effectiveLimit,
      missingLimits: getMissingLimits(player, selectedSkills)
    };
  });

  const ranking = [...playerStats].sort((a, b) => b.averageScore - a.averageScore);
  const best = ranking[0];
  const worst = ranking[ranking.length - 1];
  const bestAverageScore = best.averageScore || 1;

  const weightText = weightsEnabled
    ? `<div class="summary-note"><strong>Weights:</strong> ${selectedSkills
        .map(skill => `${escapeHtml(skill)}: ${Number(weights[skill] || 0)}`)
        .join(", ")}</div>`
    : "";

  const leaderChangeText = leaderChanges.length
    ? leaderChanges
        .map(change => `S${change.season}: ${escapeHtml(change.playerName)} takes the lead with ${change.value.toFixed(2)}`)
        .join("<br>")
    : "No leader changes in the selected timeframe.";

  const rankingRows = ranking.map((item, index) => {
    const projectionEndText = item.end.maxAgeReached
      ? `S${item.end.season} (age 40)`
      : `S${item.end.season}`;
    const averageRangeText = `S${item.start.season}-S${item.end.season}`;
    const missingText = item.missingLimits.length
      ? `<span class="summary-warning">Missing: ${escapeHtml(item.missingLimits.join(", "))}</span>`
      : "";
    const differenceFromBest = bestAverageScore > 0
      ? ((item.averageScore - bestAverageScore) / bestAverageScore) * 100
      : 0;
    const differenceText = index === 0
      ? "Best"
      : `${differenceFromBest.toFixed(2)}%`;

    return `
      <tr>
        <td>${index + 1}</td>
        <td>
          <strong>${escapeHtml(item.player.playerName || "Unknown Player")}</strong>
          ${item.end.maxAgeReached ? '<span class="summary-tag">40</span>' : ""}
          <span class="summary-range">${averageRangeText}</span>
          ${missingText}
        </td>
        <td><strong>${item.averageScore.toFixed(2)}</strong></td>
        <td class="${index === 0 ? "summary-positive" : "summary-negative"}">${differenceText}</td>
        <td>${projectionEndText}</td>
      </tr>
    `;
  }).join("");

  summary.innerHTML = `
    <h2>Summary</h2>

    <div class="summary-decision-grid">
      <div class="summary-decision summary-best">
        <span>Best choice</span>
        <strong>${escapeHtml(best.player.playerName || "Unknown Player")}</strong>
        <small>Avg ${best.averageScore.toFixed(2)} across S${best.start.season}-S${best.end.season}</small>
      </div>
      <div class="summary-decision summary-worst">
        <span>Weakest choice</span>
        <strong>${escapeHtml(worst.player.playerName || "Unknown Player")}</strong>
        <small>Avg ${worst.averageScore.toFixed(2)} across S${worst.start.season}-S${worst.end.season}</small>
      </div>
    </div>

    <p class="summary-recommendation">
      ${escapeHtml(best.player.playerName || "Unknown Player")} has the highest average score across the selected timeframe.
      ${escapeHtml(worst.player.playerName || "Unknown Player")} has the lowest average score.
      The percentage column compares each average to the best average.
    </p>

    <table class="summary-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>Avg</th>
          <th>% vs best</th>
          <th>Until</th>
        </tr>
      </thead>
      <tbody>${rankingRows}</tbody>
    </table>

    <div class="summary-note">
      <strong>Settings:</strong>
      ${escapeHtml(selectedSkills.join(", "))} | ${modeText} | Age decay: ${ageDecayText} | S0 to S${lastSeason}
      <br>
      <strong>Decision metric:</strong> Avg is calculated across the visible projection points, including S0.
    </div>
    ${weightText}

    <div class="summary-note">
      <strong>Start leader:</strong> ${escapeHtml(winnerAtStart.player.playerName)} (${winnerAtStart.value.toFixed(2)})
      <br>
      <strong>End leader:</strong> ${escapeHtml(winnerAtEnd.player.playerName)} (${winnerAtEnd.value.toFixed(2)})
      <br>
      <strong>Leader changes:</strong><br>
      ${leaderChangeText}
    </div>
  `;
}

function createPlayerCard(initialData = {}) {
  playerCounter++;

  const container = document.getElementById("players-container");
  if (!container) return;

  const playerId = playerCounter;

  const card = document.createElement("div");
  card.className = "panel player-panel";
  card.dataset.playerId = playerId;

  card.innerHTML = `
    <div class="player-card-header">
      <h2>Player ${playerId}</h2>
      <button type="button" class="remove-player-button">Remove</button>
    </div>
    <div class="saved-player-row">
      <select class="saved-player-select">
        <option value="">Saved players...</option>
      </select>

      <button type="button" class="load-saved-player-button">Load</button>
      <button type="button" class="save-player-button">Save</button>
      <button type="button" class="delete-saved-player-button">Delete</button>
    </div>

    <textarea class="player-input" placeholder="Paste player here">${escapeHtml(initialData.text || "")}</textarea>

    <label>
      Start games
      <input class="player-games" type="number" value="${Number(initialData.startGames || 0)}" min="0">
    </label>

    <label>
      Heart mode
      <select class="player-heart-mode">
        <option value="progressive" ${initialData.heartMode === "progressive" ? "selected" : ""}>Progressive</option>
        <option value="constant4" ${initialData.heartMode === "constant4" ? "selected" : ""}>Constant 4%</option>
      </select>
    </label>
  <label class="player-ability-label">
    <input class="player-loyal" type="checkbox" ${initialData.loyal ? "checked" : ""}>
    Loyal
  </label>

  <label class="player-ability-label">
    <input class="player-fragger" type="checkbox" ${initialData.fragger ? "checked" : ""}>
    Fragger
  </label>

  <label class="player-ability-label">
    <input class="player-tryhard" type="checkbox" ${initialData.tryhard ? "checked" : ""}>
    Tryhard
  </label>
  `;

  card.querySelector(".remove-player-button").addEventListener("click", () => {
    const playerCards = document.querySelectorAll(".player-panel");

    if (playerCards.length <= 2) {
      alert("At least two players are required.");
      return;
    }

    card.remove();
    updatePlayerCardTitles();
    saveAppState();
  });
  card.querySelector(".save-player-button").addEventListener("click", () => {
  const text = card.querySelector(".player-input").value.trim();
  savePlayerToStorage(text);
  });

  card.querySelector(".load-saved-player-button").addEventListener("click", () => {
    const select = card.querySelector(".saved-player-select");
    const playerId = select.value;

    if (!playerId) return;

    const savedPlayer = getSavedPlayers().find(player => player.id === playerId);

    if (!savedPlayer) return;

    card.querySelector(".player-input").value = savedPlayer.text;
    saveAppState();
  });

  card.querySelector(".delete-saved-player-button").addEventListener("click", () => {
    const select = card.querySelector(".saved-player-select");
    const playerId = select.value;

    if (!playerId) return;

    const savedPlayer = getSavedPlayers().find(player => player.id === playerId);

    if (!savedPlayer) return;

    const confirmed = confirm(`Delete saved player "${savedPlayer.name}"?`);

    if (!confirmed) return;

    deleteSavedPlayer(playerId);
  });

  container.appendChild(card);
  updatePlayerCardTitles();
  refreshSavedPlayerSelects();
}

function updatePlayerCardTitles() {
  document.querySelectorAll(".player-panel").forEach((card, index) => {
    const title = card.querySelector(".player-card-header h2");
    if (title) title.textContent = `Player ${index + 1}`;
  });
}

function getPlayerInputs() {
  return Array.from(document.querySelectorAll(".player-panel")).map((card, index) => {
    const inputText = card.querySelector(".player-input")?.value.trim() || "";
    const startGames = Number(card.querySelector(".player-games")?.value) || 0;
    const heartMode = card.querySelector(".player-heart-mode")?.value || "progressive";
    const loyal = card.querySelector(".player-loyal")?.checked || false;
    const fragger = card.querySelector(".player-fragger")?.checked || false;
    const tryhard = card.querySelector(".player-tryhard")?.checked || false;
    

    return {
      index,
      inputText,
      startGames,
      heartMode,
      loyal,
      fragger,
      tryhard
    };
  });
}

function runComparison() {
  const playerInputs = getPlayerInputs();

  if (playerInputs.length < 2) {
    alert("Please add at least two players.");
    return;
  }

  const selectedSkills = getSelectedSkills();
  const weightsEnabled = useSkillWeights();
  const weights = getSkillWeights();
  const applyAgeDecay = shouldApplyAgeDecay();
  const useAnalysisFeature = shouldUseAnalysisFeature();
  if (selectedSkills.length === 0) {
    alert("Please select at least one skill.");
    return;
  }

  const gamesPerSeason = Number(document.getElementById("games-per-season")?.value) || 57;
  const seasonCount = Number(document.getElementById("season-count")?.value) || 15;

  const parsedPlayers = playerInputs
    .map(playerInput => {
      if (!playerInput.inputText) return null;

      const player = parsePlayerText(playerInput.inputText);
      const abilities = {
        fragger: playerInput.fragger,
        tryhard: playerInput.tryhard
      };

      if (!player.skills.length) return null;

      const projection = buildProjection(
        player,
        selectedSkills,
        playerInput.startGames,
        playerInput.heartMode,
        gamesPerSeason,
        seasonCount,
        playerInput.loyal,
        weights,
        weightsEnabled,
        abilities,
        applyAgeDecay,
        useAnalysisFeature
      );

      if (!projection.length) return null;

      return {
        ...player,
        startGames: playerInput.startGames,
        heartMode: playerInput.heartMode,
        loyal: playerInput.loyal,
        fragger: playerInput.fragger,
        tryhard: playerInput.tryhard,
        projection
      };
    })
    .filter(Boolean);

  if (parsedPlayers.length < 2) {
    alert("Please paste at least two valid players.");
    return;
  }

  renderChart(parsedPlayers, weightsEnabled, applyAgeDecay, useAnalysisFeature);
  renderDecisionSummary(parsedPlayers, selectedSkills, weights, weightsEnabled, applyAgeDecay, useAnalysisFeature);
  saveAppState();
}

function getAbilityModifierForSkill(skillName, abilities = {}) {
  let modifier = 0;

  if (abilities.fragger) {
    if (["Movement", "Quickness", "Determination"].includes(skillName)) {
      modifier += 0.02;
    }

    if (["Teamplay", "Gamesense", "Awareness"].includes(skillName)) {
      modifier -= 0.02;
    }
  }

  if (abilities.tryhard) {
    if (["Aim", "Quickness", "Determination"].includes(skillName)) {
      modifier += 0.02;
    }
  }

  return modifier;
}
const SAVED_PLAYERS_KEY = "cplLimitComparison.savedPlayers";

function getSavedPlayers() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_PLAYERS_KEY)) || [];
  } catch {
    return [];
  }
}

function setSavedPlayers(players) {
  localStorage.setItem(SAVED_PLAYERS_KEY, JSON.stringify(players));
}

function savePlayerToStorage(playerText) {
  const parsed = parsePlayerText(playerText);

  if (!playerText.trim() || !parsed.skills.length) {
    alert("Cannot save invalid player data.");
    return;
  }

  const savedPlayers = getSavedPlayers();
  const playerName = parsed.playerName || "Unknown Player";

  const existingIndex = savedPlayers.findIndex(player => player.name === playerName);

  const savedPlayer = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: playerName,
    age: parsed.playerAge,
    text: playerText,
    savedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    savedPlayers[existingIndex] = {
      ...savedPlayers[existingIndex],
      ...savedPlayer,
      id: savedPlayers[existingIndex].id
    };
  } else {
    savedPlayers.push(savedPlayer);
  }

  setSavedPlayers(savedPlayers);
  refreshSavedPlayerSelects();
}

function deleteSavedPlayer(playerId) {
  const savedPlayers = getSavedPlayers().filter(player => player.id !== playerId);
  setSavedPlayers(savedPlayers);
  refreshSavedPlayerSelects();
}

function refreshSavedPlayerSelects() {
  const savedPlayers = getSavedPlayers();

  document.querySelectorAll(".saved-player-select").forEach(select => {
    const currentValue = select.value;

    select.innerHTML = `
      <option value="">Saved players...</option>
      ${savedPlayers
        .map(player => `<option value="${escapeHtml(player.id)}">${escapeHtml(player.name)}</option>`)
        .join("")}
    `;

    if (savedPlayers.some(player => player.id === currentValue)) {
      select.value = currentValue;
    }
  });
}
const APP_STATE_KEY = "cplLimitComparison.lastState";

function saveAppState() {
  const state = {
    players: getPlayerInputs().map(player => ({
      text: player.inputText,
      startGames: player.startGames,
      heartMode: player.heartMode,
      loyal: player.loyal,
      fragger: player.fragger,
      tryhard: player.tryhard
    })),
    selectedSkills: getSelectedSkills(),
    weights: getSkillWeights(),
    weightsEnabled: useSkillWeights(),
    applyAgeDecay: shouldApplyAgeDecay(),
    useAnalysisFeature: shouldUseAnalysisFeature(),
    gamesPerSeason: document.getElementById("games-per-season")?.value || "57",
    seasonCount: document.getElementById("season-count")?.value || "15"
  };

  localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
}

function loadAppState() {
  try {
    return JSON.parse(localStorage.getItem(APP_STATE_KEY));
  } catch {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("compare-button")?.addEventListener("click", runComparison);
  document.getElementById("add-player-button")?.addEventListener("click", () => {
    createPlayerCard();
    saveAppState();
  });

  const savedState = loadAppState();

  if (savedState?.players?.length) {
    savedState.players.forEach(player => createPlayerCard(player));
  } else {
    createPlayerCard();
    createPlayerCard();
  }
  if (savedState) {
    document.getElementById("games-per-season").value = savedState.gamesPerSeason || "57";
    document.getElementById("season-count").value = savedState.seasonCount || "15";

    document.querySelectorAll(".skill-checkbox").forEach(checkbox => {
      checkbox.checked = savedState.selectedSkills?.includes(checkbox.value) ?? true;
    });

    document.querySelectorAll(".skill-weight").forEach(input => {
  const savedWeight = savedState.weights?.[input.dataset.skill];

  if (savedWeight !== undefined && savedWeight !== null) {
    input.value = String(savedWeight);
  }
});

    const useWeightsInput = document.getElementById("use-skill-weights");
    if (useWeightsInput) {
      useWeightsInput.checked = !!savedState.weightsEnabled;
    }

    const applyAgeDecayInput = document.getElementById("apply-age-decay");
    if (applyAgeDecayInput) {
      applyAgeDecayInput.checked = !!savedState.applyAgeDecay;
    }

    const useAnalysisFeatureInput = document.getElementById("use-analysis-feature");
    if (useAnalysisFeatureInput) {
      useAnalysisFeatureInput.checked = !!savedState.useAnalysisFeature;
    }
  }

  document.addEventListener("input", saveAppState);
  document.addEventListener("change", saveAppState);
});
