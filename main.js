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

const TRYOUT_MAX_EXTRA_POINTS = 5;
const TRYOUT_MIN_LIMIT = 80;
const TRYOUT_MAX_LIMIT = 100;
const TRYOUT_TOP4_SKILLS = ["Aim", "Handling", "Quickness", "Determination"];
const TRYOUT_TOP4_CAP = 372;
const TRYOUT_TOTAL_CAP = 747;
const TRYOUT_TOP4_C_FLOOR = 365;
const TRYOUT_TOTAL_C_FLOOR = 735;
const TRYOUT_BIRTHDAY_MAX_DAYS = 35;
const TRYOUT_BIRTHDAY_S_FLOOR = 34;
const TRYOUT_BIRTHDAY_A_FLOOR = 29;
const TRYOUT_BIRTHDAY_B_FLOOR = 14;
const CPL_SEASON_DAYS = 35;
const ACADEMY_ENTRY_AGE = 15;
const MAIN_TEAM_AGE = 20;
const ACADEMY_EXP_PER_MATCH = 57;
const ACADEMY_LEADERSHIP_PER_MATCH = 23;

const tryoutState = {
  parsed: null,
  manualOverrides: {},
  extraBySkill: {},
  saveMessage: ""
};

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

const RANKING_CACHE_KEY = "cplRankingPlayersCache_v1";
const IMPORTED_PLAYERS_KEY = "cplImportedPlayers_v1";
const CPL_PROXY_BASE = "https://cpl-proxy.dissenter-cpl-tools.workers.dev";
const RANKING_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const RANKING_REQUEST_DELAY_MS = 200;
const RANKING_CONFIG = {
  season: 12,
  country: "All countries",
  type: "official",
  limit: 200
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
        !/\d+\s*yo/i.test(line)
      );
    }) || "Unknown Player";

  return {
    playerName,
    playerAge: lines.find(line => /\d+\s*yo/i.test(line)) || "",
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

function parseIntegerInput(value, fallback = null) {
  const number = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isNaN(number) ? fallback : number;
}

function parseWholeNumberInput(value, fallback = null) {
  const clean = String(value ?? "").trim();
  return /^\d+$/.test(clean) ? Number(clean) : fallback;
}

function clampInteger(value, min, max, fallback = min) {
  const parsed = parseIntegerInput(value, fallback);
  return Math.min(max, Math.max(min, parsed));
}

function parseLimitValue(value) {
  const clean = String(value || "").replace("/", "").trim();

  if (clean === "?") return null;
  if (/^\d+$/.test(clean)) return Number(clean);

  return null;
}

function parseTryoutTotal(lines) {
  const totalIndex = lines.findIndex(line => /total skill/i.test(line));

  if (totalIndex === -1) {
    return { totalSkill: null, totalLimit: null };
  }

  const totalWindow = lines.slice(totalIndex, totalIndex + 4).join(" ");
  const totalMatch = totalWindow.match(/total skill\s*(\d+)\s*\/\s*(\d+)/i) ||
    totalWindow.match(/(\d+)\s*\/\s*(\d+)/);

  return {
    totalSkill: totalMatch ? Number(totalMatch[1]) : null,
    totalLimit: totalMatch ? Number(totalMatch[2]) : null
  };
}

function parseTryoutText(text) {
  const lines = text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const ageIndex = lines.findIndex(line => /\d+\s*yo/i.test(line));
  const ageText = ageIndex >= 0 ? lines[ageIndex] : "";
  const { age, birthdayDay } = parseAgeString(ageText);
  const playerName = ageIndex > 0
    ? lines[ageIndex - 1]
    : lines.find(line => !/^(reject|sign)$/i.test(line) && !/^\d/.test(line)) || "Unknown Player";
  const { totalSkill, totalLimit } = parseTryoutTotal(lines);
  const skillMap = new Map();

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const normalizedLine = normalizeSkillName(currentLine);
    const inlineMatch = currentLine.match(/^([A-Za-z]+)\s+(\d+)\s*\/\s*(\d+|\?)$/i);

    if (inlineMatch) {
      const skillName = normalizeSkillName(inlineMatch[1]);

      if (SKILL_NAMES.includes(skillName)) {
        const visibleLimit = inlineMatch[3] === "?" ? null : Number(inlineMatch[3]);
        skillMap.set(skillName, {
          name: skillName,
          value: Number(inlineMatch[2]),
          visibleLimit,
          originalLimitText: inlineMatch[3]
        });
      }

      continue;
    }

    if (SKILL_NAMES.includes(normalizedLine)) {
      const value = parseIntegerInput(lines[i + 1], null);
      const visibleLimit = parseLimitValue(lines[i + 2]);

      skillMap.set(normalizedLine, {
        name: normalizedLine,
        value,
        visibleLimit,
        originalLimitText: visibleLimit === null ? "?" : String(visibleLimit)
      });
    }
  }

  return {
    playerName,
    ageText,
    age,
    birthdayDay,
    totalSkill,
    totalLimit,
    skills: SKILL_NAMES.map(skillName => skillMap.get(skillName) || {
      name: skillName,
      value: null,
      visibleLimit: null,
      originalLimitText: "missing"
    })
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

function getTryoutSkillWeights() {
  return getSkillWeights();
}

function setLinkedSkillWeight(skillName, value) {
  document
    .querySelectorAll(`.skill-weight[data-skill="${skillName}"], .tryout-skill-weight[data-skill="${skillName}"]`)
    .forEach(input => {
      input.value = value;
    });
}

function syncAllSkillWeights(sourceSelector = ".skill-weight") {
  const sourceInputs = document.querySelectorAll(sourceSelector);

  sourceInputs.forEach(input => {
    const skillName = input.dataset.skill;
    if (!skillName) return;

    setLinkedSkillWeight(skillName, input.value);
  });
}

function setupLinkedSkillWeights() {
  document.querySelectorAll(".skill-weight, .tryout-skill-weight").forEach(input => {
    input.addEventListener("input", () => {
      setLinkedSkillWeight(input.dataset.skill, input.value);
      renderTryoutAnalyzer();
    });
  });
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
  savePlayerToStorage(text, {
    startGames: Number(card.querySelector(".player-games")?.value) || 0,
    heartMode: card.querySelector(".player-heart-mode")?.value || "progressive",
    loyal: card.querySelector(".player-loyal")?.checked || false,
    fragger: card.querySelector(".player-fragger")?.checked || false,
    tryhard: card.querySelector(".player-tryhard")?.checked || false
  });
  });

  card.querySelector(".load-saved-player-button").addEventListener("click", () => {
    const select = card.querySelector(".saved-player-select");
    const selectedValue = select.value;

    if (!selectedValue) return;

    const selectedPlayer = getSelectablePlayers().find(player => player.value === selectedValue);

    if (!selectedPlayer) return;

    card.querySelector(".player-input").value = selectedPlayer.text;

    if (Number.isFinite(selectedPlayer.startGames)) {
      card.querySelector(".player-games").value = String(selectedPlayer.startGames);
    }

    if (selectedPlayer.heartMode) {
      card.querySelector(".player-heart-mode").value = selectedPlayer.heartMode;
    }

    ["loyal", "fragger", "tryhard"].forEach(abilityName => {
      if (typeof selectedPlayer[abilityName] === "boolean") {
        const checkbox = card.querySelector(`.player-${abilityName}`);
        if (checkbox) checkbox.checked = selectedPlayer[abilityName];
      }
    });

    saveAppState();
  });

  card.querySelector(".delete-saved-player-button").addEventListener("click", () => {
    const select = card.querySelector(".saved-player-select");
    const selectedValue = select.value;

    if (!selectedValue) return;

    const selectedPlayer = getSelectablePlayers().find(player => player.value === selectedValue);

    if (!selectedPlayer) return;

    const confirmed = confirm(`Delete player "${selectedPlayer.name}"?`);

    if (!confirmed) return;

    if (selectedPlayer.source === "imported") {
      deleteImportedPlayer(selectedPlayer.id);
    } else {
      deleteSavedPlayer(selectedPlayer.id);
    }
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

function getTryoutEstimationMode() {
  return document.getElementById("tryout-estimation-mode")?.value || "average";
}

function getTryoutCurrentSeasonDay() {
  const input = document.getElementById("tryout-current-season-day");
  const rawText = input?.value ?? "1";
  const rawValue = parseIntegerInput(rawText, 1);
  const value = Math.min(CPL_SEASON_DAYS, Math.max(1, rawValue));

  if (input && rawText !== "" && rawValue !== value) {
    input.value = String(value);
  }

  return value;
}

function isTryoutLeaderIconChecked() {
  return document.getElementById("tryout-leader-icon")?.checked || false;
}

function getDistributionWeight(skillName, weights = {}) {
  const weight = Number(weights[skillName]);
  return weight > 0 ? weight : 1;
}

function getSkillOrder(skillName) {
  const index = SKILL_NAMES.indexOf(skillName);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function distributeAverageLimitPool(skillNames, remainingLimitPool, weights = {}) {
  const allocations = {};

  if (!skillNames.length) return allocations;

  const minTotal = skillNames.length * TRYOUT_MIN_LIMIT;
  const maxTotal = skillNames.length * TRYOUT_MAX_LIMIT;

  if (remainingLimitPool < minTotal || remainingLimitPool > maxTotal) {
    return allocations;
  }

  const extraPool = remainingLimitPool - minTotal;
  const maxExtraPerSkill = TRYOUT_MAX_LIMIT - TRYOUT_MIN_LIMIT;
  const baseExtra = Math.floor(extraPool / skillNames.length);
  const remainder = extraPool - baseExtra * skillNames.length;
  const remainderOrder = [...skillNames].sort((a, b) => {
    const weightDifference = getDistributionWeight(b, weights) - getDistributionWeight(a, weights);
    return weightDifference || getSkillOrder(a) - getSkillOrder(b);
  });

  skillNames.forEach(skillName => {
    allocations[skillName] = TRYOUT_MIN_LIMIT + Math.min(maxExtraPerSkill, baseExtra);
  });

  for (let i = 0; i < remainder; i++) {
    allocations[remainderOrder[i]] += 1;
  }

  return allocations;
}

function distributeWeightedExtraPool(skillNames, extraPool, weights = {}) {
  const allocations = {};
  const maxExtraPerSkill = TRYOUT_MAX_LIMIT - TRYOUT_MIN_LIMIT;

  skillNames.forEach(skillName => {
    allocations[skillName] = 0;
  });

  for (let point = 0; point < extraPool; point++) {
    const bestSkill = skillNames
      .filter(skillName => allocations[skillName] < maxExtraPerSkill)
      .sort((a, b) => {
        const aScore = getDistributionWeight(a, weights) / (allocations[a] + 1);
        const bScore = getDistributionWeight(b, weights) / (allocations[b] + 1);
        const scoreDifference = bScore - aScore;
        if (scoreDifference) return scoreDifference;

        const weightDifference = getDistributionWeight(b, weights) - getDistributionWeight(a, weights);
        return weightDifference || getSkillOrder(a) - getSkillOrder(b);
      })[0];

    if (!bestSkill) break;

    allocations[bestSkill] += 1;
  }

  return allocations;
}

function distributeWeightedLimitPool(skillNames, remainingLimitPool, weights = {}) {
  const allocations = {};

  if (!skillNames.length) return allocations;

  const minTotal = skillNames.length * TRYOUT_MIN_LIMIT;
  const maxTotal = skillNames.length * TRYOUT_MAX_LIMIT;

  if (remainingLimitPool < minTotal || remainingLimitPool > maxTotal) {
    return allocations;
  }

  const extraPool = remainingLimitPool - minTotal;
  const weightedExtras = distributeWeightedExtraPool(skillNames, extraPool, weights);

  // Weighted mode starts every unresolved hidden skill at the CPL tryout
  // minimum, then allocates integer points one by one to the highest weighted
  // skill that has the largest remaining weighted need. Limits are capped at 100.
  skillNames.forEach(skillName => {
    allocations[skillName] = TRYOUT_MIN_LIMIT + (weightedExtras[skillName] || 0);
  });

  return allocations;
}

function validateParsedTryout(parsed) {
  const warnings = [];

  if (!parsed.playerName || parsed.playerName === "Unknown Player") {
    warnings.push("Player name could not be parsed.");
  }

  if (parsed.age === null) {
    warnings.push("Age text could not be parsed.");
  }

  if (parsed.birthdayDay === null) {
    warnings.push("Birthday day could not be parsed from the age text.");
  }

  if (!Number.isFinite(parsed.totalSkill)) {
    warnings.push("Total current skill could not be parsed.");
  }

  if (!Number.isFinite(parsed.totalLimit)) {
    warnings.push("Total limit could not be parsed.");
  }

  const missingCurrentSkills = parsed.skills
    .filter(skill => !Number.isFinite(skill.value))
    .map(skill => skill.name);

  if (missingCurrentSkills.length) {
    warnings.push(`Current value missing for: ${missingCurrentSkills.join(", ")}.`);
  }

  return warnings;
}

function getTryoutTop4BaseSum(rows) {
  return rows
    .filter(row => TRYOUT_TOP4_SKILLS.includes(row.name))
    .reduce((total, row) => total + (Number.isFinite(row.baseLimit) ? row.baseLimit : 0), 0);
}

function enforceTryoutTop4Cap(baseRows, weights = {}) {
  const rows = baseRows.map(row => ({ ...row }));
  const warnings = [];
  let top4Sum = getTryoutTop4BaseSum(rows);

  if (top4Sum <= TRYOUT_TOP4_CAP) {
    return { rows, warnings };
  }

  let excess = top4Sum - TRYOUT_TOP4_CAP;
  const reducibleTop4 = rows
    .filter(row => (
      TRYOUT_TOP4_SKILLS.includes(row.name) &&
      row.source === "estimated" &&
      Number.isFinite(row.baseLimit) &&
      row.baseLimit > TRYOUT_MIN_LIMIT
    ))
    .sort((a, b) => {
      const weightDifference = getDistributionWeight(a.name, weights) - getDistributionWeight(b.name, weights);
      return weightDifference || getSkillOrder(a.name) - getSkillOrder(b.name);
    });
  const receivers = rows
    .filter(row => (
      !TRYOUT_TOP4_SKILLS.includes(row.name) &&
      row.source === "estimated" &&
      Number.isFinite(row.baseLimit) &&
      row.baseLimit < TRYOUT_MAX_LIMIT
    ))
    .sort((a, b) => {
      const weightDifference = getDistributionWeight(b.name, weights) - getDistributionWeight(a.name, weights);
      return weightDifference || getSkillOrder(a.name) - getSkillOrder(b.name);
    });
  let moved = 0;

  // The Top4 tryout cap is enforced only on estimated values. Known visible
  // limits and manual overrides stay fixed; if they alone exceed the cap, the
  // user gets a warning instead of silent mutation.
  while (excess > 0) {
    const reducer = reducibleTop4.find(row => row.baseLimit > TRYOUT_MIN_LIMIT);
    const receiver = receivers.find(row => row.baseLimit < TRYOUT_MAX_LIMIT);

    if (!reducer || !receiver) break;

    reducer.baseLimit -= 1;
    receiver.baseLimit += 1;
    excess -= 1;
    moved += 1;
  }

  top4Sum = getTryoutTop4BaseSum(rows);

  if (top4Sum > TRYOUT_TOP4_CAP) {
    warnings.push(`Top4 base limit sum is ${top4Sum}, expected max ${TRYOUT_TOP4_CAP}.`);
  } else if (moved > 0) {
    warnings.push(`Top4 cap applied: moved ${moved} estimated point(s) from Top4 to lower primary skills.`);
  }

  return { rows, warnings };
}

function getTryoutTier(value, maxValue, cFloor) {
  if (!Number.isFinite(value)) {
    return { tier: "C", label: "C-TIER", value, score: -Infinity };
  }

  const span = maxValue - cFloor;
  const aWidth = Math.max(1, Math.ceil(span * 0.25));
  const aFloor = maxValue - aWidth;
  let tier = "C";

  if (value >= maxValue) {
    tier = "S";
  } else if (value >= aFloor) {
    tier = "A";
  } else if (value >= cFloor) {
    tier = "B";
  }

  return {
    tier,
    label: `${tier}-TIER`,
    value,
    maxValue,
    cFloor,
    score: span > 0 ? (value - cFloor) / span : 0
  };
}

function getDaysUntilNextBirthday(currentSeasonDay, birthdayDay) {
  const currentDay = clampInteger(currentSeasonDay, 1, CPL_SEASON_DAYS, 1);
  const birthday = clampInteger(birthdayDay, 1, CPL_SEASON_DAYS, currentDay);
  const rawDelta = (birthday - currentDay + CPL_SEASON_DAYS) % CPL_SEASON_DAYS;

  return rawDelta === 0 ? CPL_SEASON_DAYS : rawDelta;
}

function getTryoutBirthdayTier(currentSeasonDay, birthdayDay) {
  const daysUntilBirthday = getDaysUntilNextBirthday(currentSeasonDay, birthdayDay);
  let tier = "C";

  if (daysUntilBirthday >= TRYOUT_BIRTHDAY_S_FLOOR) {
    tier = "S";
  } else if (daysUntilBirthday >= TRYOUT_BIRTHDAY_A_FLOOR) {
    tier = "A";
  } else if (daysUntilBirthday >= TRYOUT_BIRTHDAY_B_FLOOR) {
    tier = "B";
  }

  return {
    tier,
    label: `${tier}-TIER`,
    value: daysUntilBirthday,
    maxValue: TRYOUT_BIRTHDAY_MAX_DAYS,
    cFloor: TRYOUT_BIRTHDAY_B_FLOOR,
    score: tier === "S"
      ? 1
      : (daysUntilBirthday - TRYOUT_BIRTHDAY_B_FLOOR) /
        (TRYOUT_BIRTHDAY_S_FLOOR - TRYOUT_BIRTHDAY_B_FLOOR)
  };
}

function getTryoutCombinedTier(...tiers) {
  const tierList = Array.isArray(tiers[0]) ? tiers[0] : tiers;
  const score = tierList.reduce((total, tier) => total + tier.score, 0) / tierList.length;
  let tier = "C";

  if (score >= 1) {
    tier = "S";
  } else if (score >= 0.75) {
    tier = "A";
  } else if (score >= 0) {
    tier = "B";
  }

  return {
    tier,
    label: `${tier}-TIER`,
    score
  };
}

function getTryoutTierSummary(rows, baseTotal, currentSeasonDay, birthdayDay) {
  const top4Sum = getTryoutTop4BaseSum(rows);
  const totalTier = getTryoutTier(baseTotal, TRYOUT_TOTAL_CAP, TRYOUT_TOTAL_C_FLOOR);
  const top4Tier = getTryoutTier(top4Sum, TRYOUT_TOP4_CAP, TRYOUT_TOP4_C_FLOOR);
  const birthdayTier = getTryoutBirthdayTier(currentSeasonDay, birthdayDay);
  const combinedTier = getTryoutCombinedTier(totalTier, top4Tier, birthdayTier);

  return {
    top4Sum,
    totalTier,
    top4Tier,
    birthdayTier,
    combinedTier
  };
}

function normalizeTryoutExtraBySkill(rows, extraBySkill = {}) {
  const normalized = {};
  const warnings = [];
  const capacityBySkill = {};
  let used = 0;
  let capped = false;

  SKILL_NAMES.forEach(skillName => {
    const row = rows.find(item => item.name === skillName);
    const baseLimit = row?.baseLimit;
    const requested = clampInteger(extraBySkill[skillName], 0, TRYOUT_MAX_EXTRA_POINTS, 0);
    const skillCapacity = Number.isFinite(baseLimit)
      ? Math.max(0, TRYOUT_MAX_LIMIT - baseLimit)
      : 0;
    const totalCapacity = TRYOUT_MAX_EXTRA_POINTS - used;
    const extra = Math.min(requested, skillCapacity, totalCapacity);

    if (requested > extra) {
      capped = true;
    }

    normalized[skillName] = extra;
    capacityBySkill[skillName] = skillCapacity;
    used += extra;
  });

  if (capped) {
    warnings.push(`Extra limit points are capped at ${TRYOUT_MAX_EXTRA_POINTS} total and ${TRYOUT_MAX_LIMIT} per skill.`);
  }

  return {
    extraBySkill: normalized,
    capacityBySkill,
    extraUsed: used,
    warnings
  };
}

function getTryoutExtraUsed(extraBySkill = tryoutState.extraBySkill) {
  return SKILL_NAMES.reduce((total, skillName) => {
    return total + clampInteger(extraBySkill[skillName], 0, TRYOUT_MAX_EXTRA_POINTS, 0);
  }, 0);
}

function calculateTryoutFinalLimits(
  parsed,
  mode,
  weights,
  manualOverrides,
  extraBySkill = {},
  currentSeasonDay = 1
) {
  const warnings = [];
  const hiddenSkills = parsed.skills.filter(skill => skill.visibleLimit === null);
  const manualLimits = {};

  hiddenSkills.forEach(skill => {
    if (!Object.prototype.hasOwnProperty.call(manualOverrides, skill.name)) return;

    const manualValue = parseWholeNumberInput(manualOverrides[skill.name], null);

    if (manualValue === null) {
      warnings.push(`${skill.name} manual limit must be a whole number.`);
      return;
    }

    if (manualValue < TRYOUT_MIN_LIMIT || manualValue > TRYOUT_MAX_LIMIT) {
      warnings.push(`${skill.name} manual limit must be between ${TRYOUT_MIN_LIMIT} and ${TRYOUT_MAX_LIMIT}.`);
      return;
    }

    manualLimits[skill.name] = manualValue;
  });

  const knownVisibleSum = parsed.skills.reduce((total, skill) => {
    return total + (Number.isFinite(skill.visibleLimit) ? skill.visibleLimit : 0);
  }, 0);
  const manualSum = Object.values(manualLimits).reduce((total, value) => total + value, 0);
  const baseTargetTotal = Number.isFinite(parsed.totalLimit) ? parsed.totalLimit : 0;
  const unresolvedHiddenSkills = hiddenSkills
    .filter(skill => !Object.prototype.hasOwnProperty.call(manualLimits, skill.name))
    .map(skill => skill.name);
  const remainingLimitPool = baseTargetTotal - knownVisibleSum - manualSum;
  const unresolvedMinPool = unresolvedHiddenSkills.length * TRYOUT_MIN_LIMIT;
  const unresolvedMaxPool = unresolvedHiddenSkills.length * TRYOUT_MAX_LIMIT;

  parsed.skills.forEach(skill => {
    if (
      Number.isFinite(skill.visibleLimit) &&
      (skill.visibleLimit < TRYOUT_MIN_LIMIT || skill.visibleLimit > TRYOUT_MAX_LIMIT)
    ) {
      warnings.push(`${skill.name} visible limit must be between ${TRYOUT_MIN_LIMIT} and ${TRYOUT_MAX_LIMIT}.`);
    }
  });

  if (remainingLimitPool < 0) {
    warnings.push("Total hidden pool is negative after known visible limits and manual hidden overrides.");
  }

  if (baseTargetTotal > TRYOUT_TOTAL_CAP) {
    warnings.push(`Total base limit is ${baseTargetTotal}, expected max ${TRYOUT_TOTAL_CAP}.`);
  }

  if (
    unresolvedHiddenSkills.length &&
    (remainingLimitPool < unresolvedMinPool || remainingLimitPool > unresolvedMaxPool)
  ) {
    warnings.push(
      `Remaining hidden pool ${remainingLimitPool} cannot fit ${unresolvedHiddenSkills.length} hidden skill(s) between ${TRYOUT_MIN_LIMIT} and ${TRYOUT_MAX_LIMIT}.`
    );
  }

  if (remainingLimitPool > 0 && unresolvedHiddenSkills.length === 0) {
    warnings.push("There are remaining limit points but no unresolved hidden skills to receive them.");
  }

  const canAllocateHidden = remainingLimitPool >= unresolvedMinPool &&
    remainingLimitPool <= unresolvedMaxPool;
  const allocations = canAllocateHidden
    ? mode === "weighted"
      ? distributeWeightedLimitPool(unresolvedHiddenSkills, remainingLimitPool, weights)
      : distributeAverageLimitPool(unresolvedHiddenSkills, remainingLimitPool, weights)
    : {};

  let baseRows = parsed.skills.map(skill => {
    if (Number.isFinite(skill.visibleLimit)) {
      return {
        ...skill,
        baseLimit: skill.visibleLimit,
        source: "known"
      };
    }

    if (Object.prototype.hasOwnProperty.call(manualLimits, skill.name)) {
      return {
        ...skill,
        baseLimit: manualLimits[skill.name],
        source: "manual"
      };
    }

    return {
      ...skill,
      baseLimit: allocations[skill.name] ?? null,
      source: "estimated"
    };
  });
  const top4Cap = enforceTryoutTop4Cap(baseRows, weights);
  baseRows = top4Cap.rows;
  warnings.push(...top4Cap.warnings);

  const extra = normalizeTryoutExtraBySkill(baseRows, extraBySkill);
  const rows = baseRows.map(row => {
    const extraLimit = extra.extraBySkill[row.name] || 0;
    const finalLimit = Number.isFinite(row.baseLimit)
      ? row.baseLimit + extraLimit
      : null;

    return {
      ...row,
      extraLimit,
      extraCapacity: extra.capacityBySkill[row.name] || 0,
      finalLimit
    };
  });
  warnings.push(...extra.warnings);

  const finalSum = rows.reduce((total, row) => {
    return total + (Number.isFinite(row.finalLimit) ? row.finalLimit : 0);
  }, 0);
  const baseSum = rows.reduce((total, row) => {
    return total + (Number.isFinite(row.baseLimit) ? row.baseLimit : 0);
  }, 0);
  const targetTotal = baseTargetTotal + extra.extraUsed;
  const top4BaseSum = getTryoutTop4BaseSum(rows);
  const tierSummary = getTryoutTierSummary(rows, baseSum, currentSeasonDay, parsed.birthdayDay);

  if (Number.isFinite(parsed.totalLimit) && baseSum !== baseTargetTotal) {
    warnings.push(`Base skill limit sum is ${baseSum}, expected ${baseTargetTotal}.`);
  }

  if (Number.isFinite(parsed.totalLimit) && finalSum !== targetTotal) {
    warnings.push(`Final skill limit sum is ${finalSum}, expected ${targetTotal}.`);
  }

  return {
    rows,
    knownVisibleSum,
    manualSum,
    baseTargetTotal,
    targetTotal,
    remainingLimitPool,
    extraBySkill: extra.extraBySkill,
    extraUsed: extra.extraUsed,
    finalSum,
    baseSum,
    warnings,
    isValid: Number.isFinite(parsed.totalLimit) &&
      remainingLimitPool >= unresolvedMinPool &&
      remainingLimitPool <= unresolvedMaxPool &&
      rows.every(row => Number.isFinite(row.finalLimit)) &&
      rows.every(row => row.finalLimit >= TRYOUT_MIN_LIMIT && row.finalLimit <= TRYOUT_MAX_LIMIT) &&
      baseTargetTotal <= TRYOUT_TOTAL_CAP &&
      top4BaseSum <= TRYOUT_TOP4_CAP &&
      baseSum === baseTargetTotal &&
      finalSum === targetTotal,
    top4BaseSum,
    tierSummary
  };
}

function calculateAcademyMatches(parsed, currentSeasonDay) {
  const currentAge = Number.isFinite(parsed.age) ? parsed.age : ACADEMY_ENTRY_AGE;
  const birthdayDay = clampInteger(parsed.birthdayDay, 1, CPL_SEASON_DAYS, currentSeasonDay);

  if (currentAge >= MAIN_TEAM_AGE) return 0;

  // CPL aging is approximated here without scraping: one academy match is
  // counted per season day until the birthday that turns the player 20.
  const daysUntilNextBirthday = currentSeasonDay < birthdayDay
    ? birthdayDay - currentSeasonDay
    : CPL_SEASON_DAYS - currentSeasonDay + birthdayDay;
  const fullSeasonsAfterNextBirthday = Math.max(0, MAIN_TEAM_AGE - currentAge - 1);

  return Math.max(0, daysUntilNextBirthday + fullSeasonsAfterNextBirthday * CPL_SEASON_DAYS);
}

function calculateAcademyProgress(parsed, currentSeasonDay, leaderIcon = false) {
  const matches = calculateAcademyMatches(parsed, currentSeasonDay);
  const totalExp = matches * ACADEMY_EXP_PER_MATCH;
  const gainedLevels = Math.floor(totalExp / 500);
  const expLevel = Math.min(20, 1 + gainedLevels);
  const expProgress = expLevel >= 20 ? 500 : totalExp % 500;
  const leadershipPointsPerMatch = ACADEMY_LEADERSHIP_PER_MATCH * (leaderIcon ? 1.25 : 1);
  const totalLeadershipPoints = matches * leadershipPointsPerMatch;
  const leadershipLevel = Math.floor(totalLeadershipPoints / 500);
  const leadershipProgress = totalLeadershipPoints % 500;

  return {
    matches,
    totalExp,
    expLevel,
    expProgress,
    leadershipPointsPerMatch,
    totalLeadershipPoints,
    leadershipLevel,
    leadershipProgress
  };
}

function buildSavedTryoutPlayerText(parsed, rows) {
  const birthdayDay = parsed.birthdayDay ?? 1;
  const lines = [
    parsed.playerName || "Unknown Player",
    `20yo (day ${birthdayDay})`,
    ""
  ];

  rows.forEach(row => {
    lines.push(row.name);
    lines.push(String(row.value));
    lines.push(`/ ${row.finalLimit}`);
  });

  return lines.join("\n");
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getNestedValue(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function firstDefined(object, paths) {
  for (const path of paths) {
    const value = getNestedValue(object, path);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function parseTeamIdValue(value) {
  const clean = String(value ?? "").trim();
  return clean ? clean : "";
}

function getRankingUrl(page) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(RANKING_CONFIG.limit),
    country: RANKING_CONFIG.country,
    type: RANKING_CONFIG.type,
    season: String(RANKING_CONFIG.season)
  });

  return `${CPL_PROXY_BASE}/rankings/players?${params.toString()}`;
}

async function fetchRankingPage(page) {
  const response = await fetch(getRankingUrl(page), {
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Ranking page ${page} failed with HTTP ${response.status}`);
  }

  return response.json();
}

function isPlayerLikeRankingEntry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const id = firstDefined(value, ["id", "playerId", "player.id"]);
  const teamId = firstDefined(value, ["teamId", "team.id", "teamID"]);

  return id !== null && teamId !== null;
}

function extractRankingPlayers(rawData) {
  const results = [];
  const visited = new WeakSet();

  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      const playerLikeEntries = value.filter(isPlayerLikeRankingEntry);

      if (playerLikeEntries.length) {
        results.push(...playerLikeEntries);
      }

      value.forEach(visit);
      return;
    }

    if (isPlayerLikeRankingEntry(value)) {
      results.push(value);
    }

    Object.values(value).forEach(visit);
  }

  visit(rawData);

  const seen = new Set();
  return results.filter(player => {
    const id = String(firstDefined(player, ["id", "playerId", "player.id"]));
    const teamId = String(firstDefined(player, ["teamId", "team.id", "teamID"]));
    const key = `${id}:${teamId}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getRankingCache() {
  try {
    return JSON.parse(localStorage.getItem(RANKING_CACHE_KEY));
  } catch {
    return null;
  }
}

function setRankingCache(players) {
  localStorage.setItem(RANKING_CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    season: RANKING_CONFIG.season,
    country: RANKING_CONFIG.country,
    type: RANKING_CONFIG.type,
    limit: RANKING_CONFIG.limit,
    players
  }));
}

async function loadRankingDataWithCache(forceRefresh = false, onProgress = () => {}) {
  const cached = getRankingCache();
  const cacheMatchesConfig =
    cached?.season === RANKING_CONFIG.season &&
    cached?.country === RANKING_CONFIG.country &&
    cached?.type === RANKING_CONFIG.type &&
    cached?.limit === RANKING_CONFIG.limit;
  const cacheIsFresh = cached?.timestamp && Date.now() - cached.timestamp < RANKING_CACHE_MAX_AGE_MS;

  if (!forceRefresh && cacheMatchesConfig && cacheIsFresh && Array.isArray(cached.players)) {
    console.info("CPL ranking data loaded from cache", { count: cached.players.length });
    onProgress(`Using cached ranking data (${cached.players.length} players).`);
    return {
      source: "cache",
      players: cached.players
    };
  }

  const players = [];
  let page = 1;

  while (true) {
    onProgress(`Loading ranking page ${page}...`);
    const rawPage = await fetchRankingPage(page);
    const pagePlayers = extractRankingPlayers(rawPage);

    players.push(...pagePlayers);
    console.info("CPL ranking page loaded", { page, count: pagePlayers.length });

    if (pagePlayers.length < RANKING_CONFIG.limit) {
      break;
    }

    page++;
    await delay(RANKING_REQUEST_DELAY_MS);
  }

  if (!players.length) {
    throw new Error("Ranking data loaded, but no player entries could be parsed.");
  }

  setRankingCache(players);
  console.info("CPL ranking data loaded from API", { count: players.length });

  return {
    source: "api",
    players
  };
}

function findPlayerIdsByTeamId(rankingPlayers, teamId) {
  const wantedTeamId = String(teamId);
  const ids = new Set();

  rankingPlayers.forEach(player => {
    const playerTeamId = firstDefined(player, ["teamId", "team.id", "teamID"]);
    const playerId = firstDefined(player, ["id", "playerId", "player.id"]);

    if (String(playerTeamId) === wantedTeamId && playerId !== null) {
      ids.add(String(playerId));
    }
  });

  return Array.from(ids);
}

async function fetchPlayerDetails(playerId) {
  const response = await fetch(`${CPL_PROXY_BASE}/players/${encodeURIComponent(playerId)}`, {
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Player ${playerId} failed with HTTP ${response.status}`);
  }

  return response.json();
}

function extractPlayerDetailObject(rawData) {
  if (!rawData || typeof rawData !== "object") return {};

  if (Array.isArray(rawData.lineups) || firstDefined(rawData, ["id", "playerId"]) !== null) {
    return rawData;
  }

  const candidates = [
    rawData.player,
    rawData.data,
    rawData.data?.player,
    rawData.result,
    rawData.result?.player
  ];

  return candidates.find(candidate =>
    candidate &&
    typeof candidate === "object" &&
    (Array.isArray(candidate.lineups) || firstDefined(candidate, ["id", "playerId"]) !== null)
  ) || rawData;
}

function pickSkillValue(apiPlayer, skillKey, suffix) {
  const pascalKey = skillKey.charAt(0).toUpperCase() + skillKey.slice(1);

  return firstDefined(apiPlayer, [
    `${skillKey}Skill${suffix}`,
    `${skillKey}${suffix}`,
    `skills.${skillKey}.${suffix.toLowerCase()}`,
    `skills.${skillKey}.skill${suffix}`,
    `skills.${pascalKey}.${suffix.toLowerCase()}`,
    `skills.${pascalKey}.skill${suffix}`
  ]);
}

function normalizeCplPlayer(apiPlayer) {
  const id = firstDefined(apiPlayer, ["id", "playerId"]);
  const nick = firstDefined(apiPlayer, ["nick", "nickname", "name"]);
  const name = firstDefined(apiPlayer, ["name", "fullName", "nick", "nickname"]);
  const lineups = Array.isArray(apiPlayer.lineups) ? apiPlayer.lineups : [];
  const teamId = firstDefined(apiPlayer, [
    "teamId",
    "team.id",
    "lineup.teamId",
    "lineups.0.teamId",
    "lineups.0.team.id"
  ]);

  const normalized = {
    id: id === null ? "" : String(id),
    name: name || nick || "Unknown Player",
    nick: nick || name || "Unknown Player",
    teamId: teamId === null ? "" : String(teamId),
    age: firstDefined(apiPlayer, ["age", "playerAge"]),
    birthday: firstDefined(apiPlayer, ["birthday", "birthDay", "birthdayDay"]),
    totalSkill: firstDefined(apiPlayer, ["totalSkill", "skillTotal"]),
    totalLimit: firstDefined(apiPlayer, ["totalLimit", "limitTotal"]),
    favoriteWeapon: firstDefined(apiPlayer, ["favoriteWeapon", "weapon"]),
    favoriteMap: firstDefined(apiPlayer, ["favoriteMap", "map"]),
    leadershipLevel: firstDefined(apiPlayer, ["leadershipLevel", "leadership"]),
    experienceLevel: firstDefined(apiPlayer, ["experienceLevel", "experience"]),
    isStarter: Boolean(firstDefined(apiPlayer, ["isStarter", "starter", "lineups.0.isStarter"])),
    specials: firstDefined(apiPlayer, ["specials"]) || [],
    globalModifiers: firstDefined(apiPlayer, ["globalModifiers"]) || [],
    lineups,
    importedAt: new Date().toISOString()
  };

  [
    "aim",
    "handling",
    "quickness",
    "determination",
    "awareness",
    "teamplay",
    "gamesense",
    "movement"
  ].forEach(skillKey => {
    normalized[`${skillKey}SkillValue`] = pickSkillValue(apiPlayer, skillKey, "Value");
    normalized[`${skillKey}SkillLimit`] = pickSkillValue(apiPlayer, skillKey, "Limit");
  });

  normalized.text = createPlayerTextFromImportedPlayer(normalized);

  return normalized;
}

function formatImportedAge(player) {
  if (player.age === null || player.age === undefined || player.age === "") return "";

  const birthdayText = player.birthday !== null && player.birthday !== undefined && player.birthday !== ""
    ? ` day ${player.birthday}`
    : "";

  return `${player.age}yo${birthdayText}`;
}

function createPlayerTextFromImportedPlayer(player) {
  const lines = [
    player.nick || player.name || "Unknown Player",
    formatImportedAge(player)
  ].filter(Boolean);

  const skillMap = [
    ["Aim", "aim"],
    ["Handling", "handling"],
    ["Quickness", "quickness"],
    ["Determination", "determination"],
    ["Awareness", "awareness"],
    ["Teamplay", "teamplay"],
    ["Gamesense", "gamesense"],
    ["Movement", "movement"]
  ];

  skillMap.forEach(([label, key]) => {
    const value = player[`${key}SkillValue`];
    const limit = player[`${key}SkillLimit`];

    lines.push(`${label} ${Number(value || 0)} / ${limit ?? "?"}`);
  });

  return lines.join("\n");
}

function renderTryoutAnalyzer() {
  const results = document.getElementById("tryout-results");
  if (!results) return;

  if (!tryoutState.parsed) {
    results.innerHTML = '<p class="tryout-empty">Paste a tryout player and run Parse/Analyze.</p>';
    return;
  }

  const parsed = tryoutState.parsed;
  const mode = getTryoutEstimationMode();
  const weights = getTryoutSkillWeights();
  const currentSeasonDay = getTryoutCurrentSeasonDay();
  const leaderIcon = isTryoutLeaderIconChecked();
  const calculation = calculateTryoutFinalLimits(
    parsed,
    mode,
    weights,
    tryoutState.manualOverrides,
    tryoutState.extraBySkill,
    currentSeasonDay
  );
  tryoutState.extraBySkill = { ...calculation.extraBySkill };
  const academy = calculateAcademyProgress(parsed, currentSeasonDay, leaderIcon);
  const validationWarnings = validateParsedTryout(parsed);
  const warnings = [
    ...validationWarnings,
    ...calculation.warnings
  ];
  const currentValuesValid = parsed.skills.every(skill => Number.isFinite(skill.value));
  const canSave = calculation.isValid && currentValuesValid && validationWarnings.length === 0;
  const modeText = mode === "weighted" ? "Weighted best distribution" : "Average distribution";
  const tierSummary = calculation.tierSummary;
  const tierCards = [
    {
      label: "Combined",
      tier: tierSummary.combinedTier,
      detail: "Total + Top4 + Birthday"
    },
    {
      label: "Total",
      tier: tierSummary.totalTier,
      detail: `${calculation.baseSum}/${TRYOUT_TOTAL_CAP}`
    },
    {
      label: "Top4",
      tier: tierSummary.top4Tier,
      detail: `${tierSummary.top4Sum}/${TRYOUT_TOP4_CAP}`
    },
    {
      label: "Birthday",
      tier: tierSummary.birthdayTier,
      detail: `${tierSummary.birthdayTier.value}/${TRYOUT_BIRTHDAY_MAX_DAYS} days`
    }
  ].map(item => `
    <div class="tryout-tier-card tier-${escapeHtml(item.tier.tier.toLowerCase())}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.tier.label)}</strong>
      <small>${escapeHtml(item.detail)}</small>
    </div>
  `).join("");

  const skillRows = calculation.rows.map(row => {
    const isHidden = row.visibleLimit === null;
    const manualValue = tryoutState.manualOverrides[row.name] ?? "";
    const inputValue = isHidden ? manualValue : "";
    const value = Number.isFinite(row.value) ? row.value : 0;
    const limit = Number.isFinite(row.finalLimit) ? row.finalLimit : 0;
    const currentPercent = Math.min(100, Math.max(0, value));
    const limitPercent = Math.min(100, Math.max(currentPercent, limit));
    const limitText = Number.isFinite(row.finalLimit) ? row.finalLimit : "?";
    const baseLimitText = Number.isFinite(row.baseLimit) ? row.baseLimit : "";
    const displayedLimitClass = row.visibleLimit === null ? row.source : "known";
    const extraPlusDisabled =
      calculation.extraUsed >= TRYOUT_MAX_EXTRA_POINTS ||
      !Number.isFinite(row.baseLimit) ||
      row.extraLimit >= row.extraCapacity;
    const extraMinusDisabled = row.extraLimit <= 0;

    return `
      <div class="tryout-skill-row">
        <div class="tryout-skill-name">${escapeHtml(row.name)}</div>
        <div class="tryout-skill-track" title="${escapeHtml(row.name)}: ${value}/${limit || "?"}">
          <span class="tryout-skill-limit" style="width: ${limitPercent}%"></span>
          <span class="tryout-skill-current" style="width: ${currentPercent}%"></span>
        </div>
        <div class="tryout-skill-values">
          <strong>${Number.isFinite(row.value) ? row.value : "?"}</strong><span class="tryout-displayed-limit ${escapeHtml(displayedLimitClass)}">/${escapeHtml(limitText)}</span>
        </div>
        <div class="tryout-skill-edit">
          ${isHidden
            ? `
              <input
                class="tryout-final-limit-input"
                data-skill="${escapeHtml(row.name)}"
                type="number"
                min="${TRYOUT_MIN_LIMIT}"
                max="${TRYOUT_MAX_LIMIT}"
                step="1"
                aria-label="${escapeHtml(row.name)} manual base limit"
                placeholder="${escapeHtml(baseLimitText)}"
                value="${escapeHtml(inputValue)}"
              >
            `
            : '<span class="tryout-fixed-limit">visible</span>'
          }
          <span class="tryout-source ${escapeHtml(row.source)}">${escapeHtml(row.source)}</span>
          <div class="tryout-extra-control" aria-label="${escapeHtml(row.name)} extra limit points">
            <button class="tryout-extra-button" type="button" data-skill="${escapeHtml(row.name)}" data-delta="-1" ${extraMinusDisabled ? "disabled" : ""}>-</button>
            <span class="tryout-extra-pill ${row.extraLimit > 0 ? "active" : ""}">+${row.extraLimit}</span>
            <button class="tryout-extra-button" type="button" data-skill="${escapeHtml(row.name)}" data-delta="1" ${extraPlusDisabled ? "disabled" : ""}>+</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  const expRemaining = academy.expLevel >= 20
    ? 0
    : 500 - academy.expProgress;
  const expNextLevel = Math.min(20, academy.expLevel + 1);
  const expGaugeDegrees = academy.expLevel >= 20
    ? 180
    : Math.round((academy.expProgress / 500) * 180);
  const leadershipProgress = academy.leadershipProgress;
  const leadershipRemaining = leadershipProgress === 0
    ? 500
    : 500 - leadershipProgress;
  const leadershipGaugeDegrees = Math.round((leadershipProgress / 500) * 180);

  const warningsHtml = warnings.length
    ? `
      <div class="tryout-warning-list">
        <strong>Warnings</strong>
        <ul>
          ${warnings.map(warning => `<li>${escapeHtml(warning)}</li>`).join("")}
        </ul>
      </div>
    `
    : '<p class="tryout-ok">Final skill limits match the expected total.</p>';

  const saveStatusHtml = tryoutState.saveMessage
    ? `<p class="tryout-save-status">${escapeHtml(tryoutState.saveMessage)}</p>`
    : "";

  results.innerHTML = `
    <div class="tryout-player-strip">
      <div>
        <span>Tryout player</span>
        <strong>${escapeHtml(parsed.playerName)}</strong>
      </div>
      <div>
        <span>Age</span>
        <strong>${escapeHtml(parsed.ageText || "?")}</strong>
      </div>
    </div>

    <div class="tryout-skill-card">
      <div class="tryout-skill-card-header">
        <h3>Primary skills</h3>
        <div class="tryout-total-pill">
          <span>Total skill</span>
          <strong>${parsed.totalSkill ?? "?"}</strong><em>/${calculation.targetTotal}</em>
        </div>
      </div>
      <div class="tryout-skill-bars">${skillRows}</div>
    </div>

    <div class="tryout-tier-panel">
      ${tierCards}
    </div>

    ${warningsHtml}

    <div class="tryout-visual-stats">
      <div class="tryout-gauge-card">
        <h3>Experience</h3>
        <div class="tryout-gauge experience" style="--gauge-deg: ${expGaugeDegrees}deg">
          <strong>${academy.expLevel}</strong>
        </div>
        <span>${academy.expLevel >= 20 ? "MAX LVL" : `${expRemaining} TO LVL ${expNextLevel}`}</span>
      </div>
      <div class="tryout-gauge-card">
        <h3>Leadership</h3>
        <div class="tryout-gauge leadership" style="--gauge-deg: ${leadershipGaugeDegrees}deg">
          <strong>${academy.leadershipLevel}</strong>
        </div>
        <span>${leadershipRemaining.toFixed(1)} TO LVL ${academy.leadershipLevel + 1}</span>
      </div>
    </div>

    <div class="tryout-calculation-grid">
      <div class="tryout-calc-item"><span>Mode</span><strong>${escapeHtml(modeText)}</strong></div>
      <div class="tryout-calc-item"><span>Extra points used</span><strong>${calculation.extraUsed} / ${TRYOUT_MAX_EXTRA_POINTS}</strong></div>
      <div class="tryout-calc-item"><span>Final sum</span><strong>${calculation.finalSum} / ${calculation.targetTotal}</strong></div>
      <div class="tryout-calc-item"><span>Remaining hidden pool</span><strong>${calculation.remainingLimitPool}</strong></div>
      <div class="tryout-calc-item"><span>Academy matches</span><strong>${academy.matches}</strong></div>
      <div class="tryout-calc-item"><span>Total EXP</span><strong>${academy.totalExp}</strong></div>
      <div class="tryout-calc-item"><span>Leadership points</span><strong>${academy.totalLeadershipPoints.toFixed(1)}</strong></div>
      <div class="tryout-calc-item"><span>Leadership per match</span><strong>${academy.leadershipPointsPerMatch.toFixed(2)}</strong></div>
    </div>

    <p class="tryout-note">
      Manual fields override hidden base limits (${TRYOUT_MIN_LIMIT}-${TRYOUT_MAX_LIMIT}); +/- tokens distribute the ${TRYOUT_MAX_EXTRA_POINTS} extra limit points.
      <br>
      Birthday tier uses days until next birthday: birthday today or yesterday is best, birthday tomorrow is worst.
      <br>
      Leadership uses ${academy.leadershipPointsPerMatch.toFixed(2)} points per academy match.
      The academy match count is a deterministic season-day approximation.
    </p>

    <div class="tryout-actions">
      <button id="tryout-save-player" type="button" ${canSave ? "" : "disabled"}>Save player for comparison</button>
      ${saveStatusHtml}
    </div>
  `;
}

function saveTryoutPlayerForComparison() {
  if (!tryoutState.parsed) return;

  const parsed = tryoutState.parsed;
  const calculation = calculateTryoutFinalLimits(
    parsed,
    getTryoutEstimationMode(),
    getTryoutSkillWeights(),
    tryoutState.manualOverrides,
    tryoutState.extraBySkill,
    getTryoutCurrentSeasonDay()
  );
  tryoutState.extraBySkill = { ...calculation.extraBySkill };
  const validationWarnings = validateParsedTryout(parsed);

  if (!calculation.isValid || validationWarnings.length) {
    tryoutState.saveMessage = "Fix the warnings before saving this tryout player.";
    renderTryoutAnalyzer();
    return;
  }

  const academy = calculateAcademyProgress(
    parsed,
    getTryoutCurrentSeasonDay(),
    isTryoutLeaderIconChecked()
  );
  const playerText = buildSavedTryoutPlayerText(parsed, calculation.rows);
  const savedPlayer = savePlayerToStorage(playerText, {
    startGames: academy.matches,
    heartMode: "progressive",
    source: "tryoutAnalyzer"
  });

  if (savedPlayer) {
    tryoutState.saveMessage = `Saved ${savedPlayer.name} with ${academy.matches} starting matches.`;
  }

  renderTryoutAnalyzer();
}

function adjustTryoutExtraLimit(skillName, delta) {
  if (!tryoutState.parsed || !SKILL_NAMES.includes(skillName)) return;

  const current = clampInteger(tryoutState.extraBySkill[skillName], 0, TRYOUT_MAX_EXTRA_POINTS, 0);

  if (delta < 0) {
    tryoutState.extraBySkill[skillName] = Math.max(0, current - 1);
    return;
  }

  const baseCalculation = calculateTryoutFinalLimits(
    tryoutState.parsed,
    getTryoutEstimationMode(),
    getTryoutSkillWeights(),
    tryoutState.manualOverrides,
    {},
    getTryoutCurrentSeasonDay()
  );
  const row = baseCalculation.rows.find(item => item.name === skillName);
  const extraUsed = getTryoutExtraUsed();
  const skillCapacity = Number.isFinite(row?.baseLimit)
    ? Math.max(0, TRYOUT_MAX_LIMIT - row.baseLimit)
    : 0;

  if (extraUsed >= TRYOUT_MAX_EXTRA_POINTS || current >= skillCapacity) {
    return;
  }

  tryoutState.extraBySkill[skillName] = current + 1;
}

function setupViewTabs() {
  document.querySelectorAll(".view-tab").forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.viewTarget;

      document.querySelectorAll(".view-tab").forEach(tab => {
        tab.classList.toggle("active", tab === button);
      });

      document.querySelectorAll(".view-panel").forEach(panel => {
        const active = panel.id === targetId;
        panel.hidden = !active;
        panel.classList.toggle("active-view", active);
      });

      if (targetId === "tryout-analyzer-view") {
        renderTryoutAnalyzer();
      }

      saveAppState();
    });
  });
}

function setupTryoutAnalyzer() {
  const parseButton = document.getElementById("tryout-parse-button");
  const results = document.getElementById("tryout-results");
  const rerender = () => {
    tryoutState.saveMessage = "";
    renderTryoutAnalyzer();
  };
  const updateManualOverride = input => {
    const skillName = input.dataset.skill;
    const value = input.value.trim();

    if (value === "") {
      delete tryoutState.manualOverrides[skillName];
    } else {
      tryoutState.manualOverrides[skillName] = value;
    }
  };

  parseButton?.addEventListener("click", () => {
    const text = document.getElementById("tryout-input")?.value || "";
    tryoutState.parsed = parseTryoutText(text);
    tryoutState.manualOverrides = {};
    tryoutState.extraBySkill = {};
    tryoutState.saveMessage = "";
    renderTryoutAnalyzer();
    saveAppState();
  });

  [
    "tryout-estimation-mode",
    "tryout-current-season-day",
    "tryout-leader-icon"
  ].forEach(id => {
    const element = document.getElementById(id);
    element?.addEventListener("input", rerender);
    element?.addEventListener("change", rerender);
  });

  results?.addEventListener("change", event => {
    const input = event.target.closest(".tryout-final-limit-input");
    if (!input || input.disabled) return;

    updateManualOverride(input);
    rerender();
  });

  results?.addEventListener("input", event => {
    const input = event.target.closest(".tryout-final-limit-input");
    if (!input || input.disabled) return;

    updateManualOverride(input);
  });

  results?.addEventListener("click", event => {
    const extraButton = event.target.closest(".tryout-extra-button");

    if (extraButton) {
      adjustTryoutExtraLimit(extraButton.dataset.skill, Number(extraButton.dataset.delta) || 0);
      rerender();
      saveAppState();
      return;
    }

    if (event.target.closest("#tryout-save-player")) {
      saveTryoutPlayerForComparison();
    }
  });
}
function loadImportedPlayers() {
  try {
    return JSON.parse(localStorage.getItem(IMPORTED_PLAYERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveImportedPlayers(players) {
  const existingPlayers = loadImportedPlayers();
  const playerMap = new Map(existingPlayers.map(player => [String(player.id), player]));

  players.forEach(player => {
    if (!player.id) return;
    playerMap.set(String(player.id), {
      ...playerMap.get(String(player.id)),
      ...player
    });
  });

  const nextPlayers = Array.from(playerMap.values())
    .sort((a, b) => String(a.nick || a.name).localeCompare(String(b.nick || b.name)));

  localStorage.setItem(IMPORTED_PLAYERS_KEY, JSON.stringify(nextPlayers));
  refreshSavedPlayerSelects();
}

function deleteImportedPlayer(playerId) {
  const nextPlayers = loadImportedPlayers().filter(player => String(player.id) !== String(playerId));
  localStorage.setItem(IMPORTED_PLAYERS_KEY, JSON.stringify(nextPlayers));
  refreshSavedPlayerSelects();
}

function getSelectablePlayers() {
  const savedPlayers = getSavedPlayers().map(player => ({
    source: "saved",
    value: `saved:${player.id}`,
    id: player.id,
    name: player.name,
    text: player.text,
    startGames: player.startGames,
    heartMode: player.heartMode,
    loyal: player.loyal,
    fragger: player.fragger,
    tryhard: player.tryhard
  }));
  const importedPlayers = loadImportedPlayers().map(player => ({
    source: "imported",
    value: `imported:${player.id}`,
    id: player.id,
    name: `${player.nick || player.name} (Team ${player.teamId || "?"})`,
    text: player.text
  }));

  return [...savedPlayers, ...importedPlayers];
}

function setTeamImportStatus(message, type = "info") {
  const status = document.getElementById("team-import-status");
  if (!status) return;

  status.textContent = message;
  status.className = `team-import-status ${type ? `team-import-status-${type}` : ""}`;
}

function setTeamImportLoading(isLoading) {
  const button = document.getElementById("load-team-button");
  const input = document.getElementById("team-id-input");

  if (button) {
    button.disabled = isLoading;
    button.textContent = isLoading ? "Loading..." : "Load Team";
  }

  if (input) {
    input.disabled = isLoading;
  }
}

async function loadTeamPlayers() {
  const teamInput = document.getElementById("team-id-input");
  const teamId = parseTeamIdValue(teamInput?.value);

  if (!teamId || !/^\d+$/.test(teamId)) {
    setTeamImportStatus("Please enter a valid numeric Team ID.", "error");
    return;
  }

  setTeamImportLoading(true);
  setTeamImportStatus("Loading ranking data...", "loading");

  try {
    const rankingResult = await loadRankingDataWithCache(false, message => setTeamImportStatus(message, "loading"));
    const rankingPlayers = rankingResult.players;
    const playerIds = findPlayerIdsByTeamId(rankingPlayers, teamId);

    console.info("CPL team import ranking source", rankingResult.source);
    console.info("CPL ranking players loaded", rankingPlayers.length);
    console.info("CPL player IDs found for team", { teamId, playerIds });

    if (!playerIds.length) {
      setTeamImportStatus(`No ranking players found for Team ID ${teamId}.`, "error");
      return;
    }

    const importedPlayers = [];
    const failedPlayers = [];
    let filteredPlayers = 0;

    for (let index = 0; index < playerIds.length; index++) {
      const playerId = playerIds[index];
      setTeamImportStatus(`Loading player ${index + 1} of ${playerIds.length}...`, "loading");

      try {
        const apiPlayer = extractPlayerDetailObject(await fetchPlayerDetails(playerId));
        const lineups = Array.isArray(apiPlayer.lineups) ? apiPlayer.lineups : [];

        if (!lineups.length) {
          filteredPlayers++;
          continue;
        }

        importedPlayers.push(normalizeCplPlayer(apiPlayer));
      } catch (error) {
        console.warn("CPL player detail failed", { playerId, error });
        failedPlayers.push(playerId);
      }

      if (index < playerIds.length - 1) {
        await delay(RANKING_REQUEST_DELAY_MS);
      }
    }

    if (!importedPlayers.length) {
      const failureText = failedPlayers.length ? ` ${failedPlayers.length} player request(s) failed.` : "";
      setTeamImportStatus(`No active lineup players found for Team ID ${teamId}.${failureText}`, "error");
      return;
    }

    saveImportedPlayers(importedPlayers);

    const warningText = failedPlayers.length
      ? ` ${failedPlayers.length} player detail request(s) failed.`
      : "";
    const message = `Loaded ${importedPlayers.length} players from Team ID ${teamId}. Filtered out ${filteredPlayers} player(s) not in a lineup.${warningText}`;

    console.info("CPL team import complete", {
      teamId,
      imported: importedPlayers.length,
      filtered: filteredPlayers,
      failed: failedPlayers.length
    });
    setTeamImportStatus(message, failedPlayers.length ? "warning" : "success");
  } catch (error) {
    console.error("CPL team import failed", error);
    setTeamImportStatus(error?.message || "Team import failed.", "error");
  } finally {
    setTeamImportLoading(false);
  }
}

const SAVED_PLAYERS_KEY = "cplLimitComparison.savedPlayers";

function getSavedPlayers() {
  try {
    const savedPlayers = JSON.parse(localStorage.getItem(SAVED_PLAYERS_KEY)) || [];
    return Array.isArray(savedPlayers) ? savedPlayers : [];
  } catch {
    return [];
  }
}

function setSavedPlayers(players) {
  localStorage.setItem(SAVED_PLAYERS_KEY, JSON.stringify(players));
}

function savePlayerToStorage(playerText, options = {}) {
  const parsed = parsePlayerText(playerText);

  if (!playerText.trim() || !parsed.skills.length) {
    alert("Cannot save invalid player data.");
    return null;
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

  if (Number.isFinite(Number(options.startGames))) {
    savedPlayer.startGames = Math.max(0, Math.round(Number(options.startGames)));
  }

  if (options.heartMode) {
    savedPlayer.heartMode = options.heartMode;
  }

  if (options.source) {
    savedPlayer.source = options.source;
  }

  ["loyal", "fragger", "tryhard"].forEach(abilityName => {
    if (typeof options[abilityName] === "boolean") {
      savedPlayer[abilityName] = options[abilityName];
    }
  });

  let storedPlayer;

  if (existingIndex >= 0) {
    savedPlayers[existingIndex] = {
      ...savedPlayers[existingIndex],
      ...savedPlayer,
      id: savedPlayers[existingIndex].id
    };
    storedPlayer = savedPlayers[existingIndex];
  } else {
    savedPlayers.push(savedPlayer);
    storedPlayer = savedPlayer;
  }

  setSavedPlayers(savedPlayers);
  refreshSavedPlayerSelects();

  return storedPlayer;
}

function deleteSavedPlayer(playerId) {
  const savedPlayers = getSavedPlayers().filter(player => player.id !== playerId);
  setSavedPlayers(savedPlayers);
  refreshSavedPlayerSelects();
}

function refreshSavedPlayerSelects() {
  const selectablePlayers = getSelectablePlayers();

  document.querySelectorAll(".saved-player-select").forEach(select => {
    const currentValue = select.value;

    select.innerHTML = `
      <option value="">Saved players...</option>
      ${selectablePlayers
        .map(player => `<option value="${escapeHtml(player.value)}">${escapeHtml(player.name)}</option>`)
        .join("")}
    `;

    if (selectablePlayers.some(player => player.value === currentValue)) {
      select.value = currentValue;
    }
  });
}
const APP_STATE_KEY = "cplLimitComparison.lastState";

function getTryoutAnalyzerState() {
  return {
    inputText: document.getElementById("tryout-input")?.value || "",
    estimationMode: document.getElementById("tryout-estimation-mode")?.value || "average",
    currentSeasonDay: document.getElementById("tryout-current-season-day")?.value || "1",
    leaderIcon: isTryoutLeaderIconChecked(),
    manualOverrides: { ...tryoutState.manualOverrides },
    extraBySkill: { ...tryoutState.extraBySkill }
  };
}

function applyTryoutAnalyzerState(state = {}) {
  const input = document.getElementById("tryout-input");
  const mode = document.getElementById("tryout-estimation-mode");
  const currentSeasonDay = document.getElementById("tryout-current-season-day");
  const leaderIcon = document.getElementById("tryout-leader-icon");
  const inputText = state.inputText || "";

  if (input) input.value = inputText;
  if (mode) mode.value = state.estimationMode || "average";
  if (currentSeasonDay) currentSeasonDay.value = state.currentSeasonDay || "1";
  if (leaderIcon) leaderIcon.checked = !!state.leaderIcon;

  tryoutState.manualOverrides = state.manualOverrides && typeof state.manualOverrides === "object"
    ? { ...state.manualOverrides }
    : {};
  tryoutState.extraBySkill = state.extraBySkill && typeof state.extraBySkill === "object"
    ? { ...state.extraBySkill }
    : {};
  tryoutState.saveMessage = "";
  tryoutState.parsed = inputText.trim() ? parseTryoutText(inputText) : null;
}

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
    seasonCount: document.getElementById("season-count")?.value || "15",
    activeView: document.querySelector(".view-panel.active-view")?.id || "limit-comparison-view",
    tryoutAnalyzer: getTryoutAnalyzerState()
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
  setupViewTabs();
  setupTryoutAnalyzer();
  document.getElementById("compare-button")?.addEventListener("click", runComparison);
  document.getElementById("load-team-button")?.addEventListener("click", loadTeamPlayers);
  document.getElementById("team-id-input")?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      loadTeamPlayers();
    }
  });
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

    applyTryoutAnalyzerState(savedState.tryoutAnalyzer);
  }

  syncAllSkillWeights(".skill-weight");
  setupLinkedSkillWeights();

  if (savedState?.activeView) {
    document
      .querySelector(`.view-tab[data-view-target="${savedState.activeView}"]`)
      ?.click();
  }

  renderTryoutAnalyzer();

  document.addEventListener("input", saveAppState);
  document.addEventListener("change", saveAppState);
});
