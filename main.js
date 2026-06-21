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

const RANKING_CACHE_KEY = "cplRankingPlayersCache_v4";
const IMPORTED_PLAYERS_KEY = "cplImportedPlayers_v1";
const TRANSFER_LIST_CACHE_KEY = "cplTransferListCache_v1";
const CPL_PROXY_BASE = "https://cpl-proxy.dissenter-cpl-tools.workers.dev";
const RANKING_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const RANKING_REQUEST_DELAY_MS = 200;
const CPL_FETCH_RETRY_COUNT = 4;
const RANKING_MAX_PAGES = 100;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CPL_TIME_ZONE = "Europe/Berlin";
const CPL_DAILY_UPDATE_HOUR = 2;
const CPL_SEASON_ANCHOR = {
  season: 12,
  seasonDay: 28,
  gameDateUtc: Date.UTC(2026, 5, 14)
};
const RANKING_CONFIG = {
  country: "All countries",
  type: "official",
  limit: 200
};
const TRANSFER_LIST_CONFIG = {
  ageRange: "13-44",
  limit: 5000
};
const TRANSFER_SUGGESTION_LIMIT = 10;
const COMMUNITY_ID = 121;
const COMMUNITY_CACHE_KEY = "cplCommunityStatsCache_v1";
const COMMUNITY_RANKING_BASELINES_KEY = "cplCommunityRankingBaselines_v1";
const COMMUNITY_TOURNAMENT_CACHE_KEY = "cplCommunityTournamentCache_v1";
const COMMUNITY_CACHE_MAX_AGE_MS = 60 * 60 * 1000;
const COMMUNITY_TOURNAMENT_CACHE_MAX_AGE_MS = 3 * 60 * 60 * 1000;
const COMMUNITY_TOURNAMENT_FETCH_LIMIT = 16;
const COMMUNITY_FALLBACK_TEAM_IDS = [4355, 3147, 1394, 2522, 143, 3277];
const CPL_MEDIA_TEAM_BASE = "https://media.cplmanager.com/teams";
const DIVISION_MAP = {
  4: "emerald",
  5: "diamond",
  6: "master"
};
const SEEDED_COMMUNITY_RANKING_BASELINES = {
  11: {
    season: 11,
    seasonDay: CPL_SEASON_DAYS,
    savedAt: "manual-seed",
    teams: {
      1394: { teamName: "Grune Mediziner", ranking: 16 },
      2522: { teamName: "King of Queens", ranking: 71 },
      4355: { teamName: "P1XELS", ranking: 35 },
      3147: { teamName: "Joy Division", ranking: 42 },
      3277: { teamName: "Trick Siebzehn", ranking: 65 },
      143: { teamName: "c64", ranking: 94 }
    }
  }
};
const COUNTRY_CODE_MAP = {
  "argentina": "AR",
  "australia": "AU",
  "austria": "AT",
  "belarus": "BY",
  "belgium": "BE",
  "bosnia and herzegovina": "BA",
  "brazil": "BR",
  "bulgaria": "BG",
  "canada": "CA",
  "chile": "CL",
  "china": "CN",
  "colombia": "CO",
  "croatia": "HR",
  "czech republic": "CZ",
  "czechia": "CZ",
  "denmark": "DK",
  "estonia": "EE",
  "finland": "FI",
  "france": "FR",
  "germany": "DE",
  "greece": "GR",
  "hungary": "HU",
  "iceland": "IS",
  "india": "IN",
  "ireland": "IE",
  "israel": "IL",
  "italy": "IT",
  "japan": "JP",
  "kazakhstan": "KZ",
  "latvia": "LV",
  "lithuania": "LT",
  "mexico": "MX",
  "netherlands": "NL",
  "new zealand": "NZ",
  "norway": "NO",
  "poland": "PL",
  "portugal": "PT",
  "romania": "RO",
  "russia": "RU",
  "serbia": "RS",
  "slovakia": "SK",
  "slovenia": "SI",
  "south africa": "ZA",
  "south korea": "KR",
  "spain": "ES",
  "sweden": "SE",
  "switzerland": "CH",
  "turkey": "TR",
  "ukraine": "UA",
  "united kingdom": "GB",
  "uk": "GB",
  "united states": "US",
  "usa": "US"
};

const transferSuggestionState = {
  requestId: 0,
  suggestions: []
};

const communityStatsState = {
  loaded: false,
  loading: false,
  error: "",
  warning: "",
  activePanel: "teams",
  communityName: `Community ${COMMUNITY_ID}`,
  teams: [],
  players: [],
  playerSearch: "",
  playerTeamId: "",
  playerSort: {
    key: "rank",
    direction: "asc"
  },
  teamSort: {
    key: "ranking",
    direction: "asc"
  },
  seasonState: null,
  ladderId: null,
  communitySource: "",
  ladderSource: "",
  rankingSource: "",
  playersSeason: null,
  lastUpdated: null
};

const communityTournamentState = {
  loaded: false,
  loading: false,
  error: "",
  warning: "",
  source: "",
  view: "championship",
  teamId: "",
  championshipItems: [],
  eosItems: [],
  season: null,
  lastUpdated: null
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

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function getBerlinDateTimeParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: CPL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const parts = {};

  formatter.formatToParts(date).forEach(part => {
    if (part.type !== "literal") {
      parts[part.type] = Number(part.value);
    }
  });

  return parts;
}

function getCplGameDateUtc(date = new Date()) {
  const parts = getBerlinDateTimeParts(date);
  let gameDateUtc = Date.UTC(parts.year, parts.month - 1, parts.day);

  if (parts.hour < CPL_DAILY_UPDATE_HOUR) {
    gameDateUtc -= MS_PER_DAY;
  }

  return gameDateUtc;
}

function getCurrentCplSeasonState(date = new Date()) {
  const dayDiff = Math.floor((getCplGameDateUtc(date) - CPL_SEASON_ANCHOR.gameDateUtc) / MS_PER_DAY);
  const anchorDayIndex = CPL_SEASON_ANCHOR.seasonDay - 1;
  const absoluteSeasonDayIndex = anchorDayIndex + dayDiff;
  const seasonOffset = Math.floor(absoluteSeasonDayIndex / CPL_SEASON_DAYS);
  const seasonDay = positiveModulo(absoluteSeasonDayIndex, CPL_SEASON_DAYS) + 1;
  const season = CPL_SEASON_ANCHOR.season + seasonOffset;

  return {
    season,
    seasonDay,
    label: `S${season}`,
    fullLabel: `S${season} D${seasonDay}`
  };
}

function getProjectionSeasonState(seasonOffset, baseState = getCurrentCplSeasonState()) {
  const season = baseState.season + seasonOffset;

  return {
    season,
    seasonDay: baseState.seasonDay,
    label: `S${season}`,
    fullLabel: `S${season} D${baseState.seasonDay}`
  };
}

function getProjectionPointLabel(point) {
  return point?.cplSeasonLabel || `S${point?.season ?? 0}`;
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
  useAnalysisFeature = false,
  baseSeasonState = getCurrentCplSeasonState()
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
    const cplSeasonState = getProjectionSeasonState(season, baseSeasonState);

    result.push({
      season,
      cplSeason: cplSeasonState.season,
      cplSeasonDay: cplSeasonState.seasonDay,
      cplSeasonLabel: cplSeasonState.label,
      cplSeasonFullLabel: cplSeasonState.fullLabel,
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
            point,
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
        label: getProjectionPointLabel(leader.point),
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

function getProjectionAverageScore(projection = []) {
  if (!projection.length) return 0;

  return projection.reduce((total, point) => total + point.effectiveLimit, 0) / projection.length;
}

function renderChart(players, weightsEnabled = false, applyAgeDecay = false, useAnalysisFeature = false) {
  const canvas = document.getElementById("comparison-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (comparisonChart) {
    comparisonChart.destroy();
  }

  const lastSeason = getLastProjectionSeason(players);
  const labels = Array.from({ length: lastSeason + 1 }, (_, season) => {
    const point = players
      .map(player => getProjectionPoint(player, season))
      .find(Boolean);

    return point ? getProjectionPointLabel(point) : getProjectionSeasonState(season).label;
  });

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
                `CPL season: ${point.cplSeasonFullLabel || getProjectionPointLabel(point)}`,
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
            text: "CPL seasons"
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
        Projection: ${getProjectionPointLabel(start)} to ${getProjectionPointLabel(end)}${end.maxAgeReached ? " (max age 40 reached)" : ""}
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
        .map(change => `${escapeHtml(change.label || `S${change.season}`)}: ${escapeHtml(change.playerName)} takes the lead with ${change.value.toFixed(2)}`)
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
  const summaryStartLabel = getProjectionPointLabel(winnerAtStart?.point || players[0]?.projection?.[0]);
  const summaryEndLabel = getProjectionPointLabel(winnerAtEnd?.point || players[0]?.projection?.[players[0]?.projection?.length - 1]);

  const playerStats = players.map(player => {
    const start = player.projection[0];
    const end = player.projection[player.projection.length - 1];
    const averageScore = getProjectionAverageScore(player.projection);

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
        .map(change => `${escapeHtml(change.label || `S${change.season}`)}: ${escapeHtml(change.playerName)} takes the lead with ${change.value.toFixed(2)}`)
        .join("<br>")
    : "No leader changes in the selected timeframe.";

  const rankingRows = ranking.map((item, index) => {
    const projectionEndText = item.end.maxAgeReached
      ? `${getProjectionPointLabel(item.end)} (age 40)`
      : getProjectionPointLabel(item.end);
    const averageRangeText = `${getProjectionPointLabel(item.start)}-${getProjectionPointLabel(item.end)}`;
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
        <small>Avg ${best.averageScore.toFixed(2)} across ${getProjectionPointLabel(best.start)}-${getProjectionPointLabel(best.end)}</small>
      </div>
      <div class="summary-decision summary-worst">
        <span>Weakest choice</span>
        <strong>${escapeHtml(worst.player.playerName || "Unknown Player")}</strong>
        <small>Avg ${worst.averageScore.toFixed(2)} across ${getProjectionPointLabel(worst.start)}-${getProjectionPointLabel(worst.end)}</small>
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
      ${escapeHtml(selectedSkills.join(", "))} | ${modeText} | Age decay: ${ageDecayText} | ${escapeHtml(summaryStartLabel)} to ${escapeHtml(summaryEndLabel)}
      <br>
      <strong>Decision metric:</strong> Avg is calculated across the visible projection points, including the current season.
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

    if (playerCards.length <= 1) {
      alert("At least one player is required.");
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
    card.dataset.loadedPlayerId = selectedPlayer.source === "imported" ? String(selectedPlayer.id) : "";
    card.dataset.loadedPlayerSource = selectedPlayer.source || "";

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

  card.querySelector(".player-input").addEventListener("input", () => {
    delete card.dataset.loadedPlayerId;
    delete card.dataset.loadedPlayerSource;
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
      tryhard,
      cplPlayerId: card.dataset.loadedPlayerId || ""
    };
  });
}

function runComparison() {
  const playerInputs = getPlayerInputs();

  if (playerInputs.length < 1) {
    clearTransferSuggestions();
    alert("Please add at least one player.");
    return;
  }

  const selectedSkills = getSelectedSkills();
  const weightsEnabled = useSkillWeights();
  const weights = getSkillWeights();
  const applyAgeDecay = shouldApplyAgeDecay();
  const useAnalysisFeature = shouldUseAnalysisFeature();
  if (selectedSkills.length === 0) {
    clearTransferSuggestions();
    alert("Please select at least one skill.");
    return;
  }

  const gamesPerSeason = Number(document.getElementById("games-per-season")?.value) || 57;
  const seasonCount = Number(document.getElementById("season-count")?.value) || 15;
  const baseSeasonState = getCurrentCplSeasonState();

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
        useAnalysisFeature,
        baseSeasonState
      );

      if (!projection.length) return null;

      return {
        ...player,
        startGames: playerInput.startGames,
        heartMode: playerInput.heartMode,
        loyal: playerInput.loyal,
        fragger: playerInput.fragger,
        tryhard: playerInput.tryhard,
        cplPlayerId: playerInput.cplPlayerId,
        projection
      };
    })
    .filter(Boolean);

  if (parsedPlayers.length < 1) {
    clearTransferSuggestions();
    alert("Please paste at least one valid player.");
    return;
  }

  renderChart(parsedPlayers, weightsEnabled, applyAgeDecay, useAnalysisFeature);
  renderDecisionSummary(parsedPlayers, selectedSkills, weights, weightsEnabled, applyAgeDecay, useAnalysisFeature);
  updateTransferSuggestionsForComparison(parsedPlayers, {
    seasonCount,
    gamesPerSeason,
    selectedSkills,
    weights,
    weightsEnabled,
    applyAgeDecay,
    useAnalysisFeature,
    baseSeasonState
  });
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
  const currentSeasonState = getCurrentCplSeasonState();
  const value = currentSeasonState.seasonDay;

  if (input) {
    input.value = String(value);
    input.title = currentSeasonState.fullLabel;
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

function getCurrentRankingSeason() {
  return getCurrentCplSeasonState().season;
}

function toFiniteNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeSearchValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getArrayCandidate(rawData, paths) {
  for (const path of paths) {
    const value = getNestedValue(rawData, path);
    if (Array.isArray(value)) return value;
  }

  return null;
}

function findArrayByEntryShape(rawData, predicate) {
  const visited = new WeakSet();

  function visit(value) {
    if (!value || typeof value !== "object" || visited.has(value)) return null;
    visited.add(value);

    if (Array.isArray(value)) {
      if (value.some(predicate)) return value;

      for (const item of value) {
        const found = visit(item);
        if (found) return found;
      }

      return null;
    }

    for (const child of Object.values(value)) {
      const found = visit(child);
      if (found) return found;
    }

    return null;
  }

  return visit(rawData);
}

function getRankingUrl(page, season = getCurrentRankingSeason()) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(RANKING_CONFIG.limit),
    country: RANKING_CONFIG.country,
    type: RANKING_CONFIG.type,
    season: String(season)
  });

  return `${CPL_PROXY_BASE}/rankings/players?${params.toString()}`;
}

async function fetchRankingPage(page, season = getCurrentRankingSeason()) {
  return fetchJsonWithRetry(getRankingUrl(page, season), {
    headers: {
      "Accept": "application/json"
    }
  }, `Ranking page ${page}`);
}

function isPlayerLikeRankingEntry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const id = firstDefined(value, ["id", "playerId", "player.id"]);
  const teamId = firstDefined(value, ["teamId", "team.id", "teamID"]);

  return id !== null && teamId !== null;
}

async function fetchJsonWithRetry(url, options, label) {
  let lastError = null;
  let lastStatus = null;

  for (let attempt = 1; attempt <= CPL_FETCH_RETRY_COUNT; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response.json();
      }

      lastStatus = response.status;

      if (response.status < 500 && response.status !== 429) {
        break;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < CPL_FETCH_RETRY_COUNT) {
      await delay(RANKING_REQUEST_DELAY_MS * attempt);
    }
  }

  if (lastStatus !== null) {
    throw new Error(`${label} failed with HTTP ${lastStatus}`);
  }

  throw lastError || new Error(`${label} failed.`);
}

function findDevalueRankingRoot(rawData) {
  const directNodes = Array.isArray(rawData?.nodes) ? rawData.nodes : [];
  for (const node of directNodes) {
    if (Array.isArray(node?.data) && node.data[0] && typeof node.data[0] === "object" && "rankingPlayers" in node.data[0]) {
      return node.data;
    }
  }

  const visited = new WeakSet();

  function visit(value) {
    if (!value || typeof value !== "object" || visited.has(value)) return null;
    visited.add(value);

    if (Array.isArray(value) && value[0] && typeof value[0] === "object" && "rankingPlayers" in value[0]) {
      return value;
    }

    const children = Array.isArray(value) ? value : Object.values(value);
    for (const child of children) {
      const found = visit(child);
      if (found) return found;
    }

    return null;
  }

  return visit(rawData);
}

function resolveRankingReference(root, value) {
  return Number.isInteger(value) && value >= 0 && value < root.length ? root[value] : value;
}

function resolveRankingScalar(root, object, key) {
  if (!object || typeof object !== "object" || !(key in object)) return null;
  return resolveRankingReference(root, object[key]);
}

function normalizeDevalueTeam(root, teamRef) {
  const team = resolveRankingReference(root, teamRef);
  if (!team || typeof team !== "object" || Array.isArray(team)) return null;

  const id = resolveRankingReference(root, team.id);
  const name = resolveRankingReference(root, team.name);

  return {
    id,
    name
  };
}

function normalizeDevalueRankingPlayer(root, playerRef, rank = null) {
  const player = resolveRankingReference(root, playerRef);
  if (!player || typeof player !== "object" || Array.isArray(player)) return null;

  const team = normalizeDevalueTeam(root, player.team);
  const id = resolveRankingReference(root, player.id ?? player.playerId);
  const teamId = team?.id ?? resolveRankingReference(root, player.teamId);
  const playerStats = resolveRankingReference(root, player.playerStats);
  const stat = resolveRankingReference(root, player.stat);
  const gamesFromStats = Array.isArray(playerStats) ? playerStats.length : null;

  if (id === null || id === undefined || teamId === null || teamId === undefined) {
    return null;
  }

  return {
    id,
    playerId: id,
    name: resolveRankingReference(root, player.name),
    nick: resolveRankingReference(root, player.nick),
    teamId,
    team,
    country: resolveRankingReference(root, player.country),
    rank,
    games: resolveRankingScalar(root, stat, "games")
      ?? resolveRankingScalar(root, stat, "matches")
      ?? resolveRankingScalar(root, player, "games")
      ?? resolveRankingScalar(root, player, "matches")
      ?? resolveRankingScalar(root, player, "totalGames")
      ?? gamesFromStats,
    kills: resolveRankingScalar(root, stat, "kills")
      ?? resolveRankingScalar(root, stat, "totalKills")
      ?? resolveRankingScalar(root, player, "kills")
      ?? resolveRankingScalar(root, player, "totalKills"),
    deaths: resolveRankingScalar(root, stat, "deaths")
      ?? resolveRankingScalar(root, stat, "totalDeaths")
      ?? resolveRankingScalar(root, player, "deaths")
      ?? resolveRankingScalar(root, player, "totalDeaths"),
    headshots: resolveRankingScalar(root, stat, "headshots")
      ?? resolveRankingScalar(root, stat, "totalHeadshots")
      ?? resolveRankingScalar(root, player, "headshots")
      ?? resolveRankingScalar(root, player, "totalHeadshots"),
    mvps: resolveRankingScalar(root, stat, "mvps")
      ?? resolveRankingScalar(root, stat, "totalMvps")
      ?? resolveRankingScalar(root, player, "mvps")
      ?? resolveRankingScalar(root, player, "totalMvps"),
    totalKills: resolveRankingScalar(root, player, "totalKills")
      ?? resolveRankingScalar(root, stat, "totalKills")
      ?? resolveRankingScalar(root, stat, "kills"),
    totalDeaths: resolveRankingScalar(root, player, "totalDeaths")
      ?? resolveRankingScalar(root, stat, "totalDeaths")
      ?? resolveRankingScalar(root, stat, "deaths"),
    totalHeadshots: resolveRankingScalar(root, player, "totalHeadshots")
      ?? resolveRankingScalar(root, stat, "totalHeadshots")
      ?? resolveRankingScalar(root, stat, "headshots"),
    totalMvps: resolveRankingScalar(root, player, "totalMvps")
      ?? resolveRankingScalar(root, stat, "totalMvps")
      ?? resolveRankingScalar(root, stat, "mvps"),
    kdRatio: resolveRankingScalar(root, player, "kdRatio")
      ?? resolveRankingScalar(root, stat, "kdRatio"),
    hsPercentage: resolveRankingScalar(root, player, "hsPercentage")
      ?? resolveRankingScalar(root, stat, "hsPercentage")
  };
}

function dedupeRankingPlayers(players) {
  const seen = new Set();

  return players.filter(player => {
    const id = String(firstDefined(player, ["id", "playerId", "player.id"]));
    const teamId = String(firstDefined(player, ["teamId", "team.id", "teamID"]));
    const key = `${id}:${teamId}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractDevalueRankingPlayers(rawData) {
  const root = findDevalueRankingRoot(rawData);
  if (!root) return null;

  const rankingPlayers = resolveRankingReference(root, root[0]?.rankingPlayers);
  if (!Array.isArray(rankingPlayers)) return [];
  const metadata = root[0] || {};
  const page = Number(resolveRankingReference(root, metadata.page));
  const limit = Number(resolveRankingReference(root, metadata.limit));
  const rankOffset = Number.isFinite(page) && page > 0 && Number.isFinite(limit) && limit > 0
    ? (page - 1) * limit
    : 0;

  return dedupeRankingPlayers(
    rankingPlayers
      .map((playerRef, index) => normalizeDevalueRankingPlayer(root, playerRef, rankOffset + index + 1))
      .filter(Boolean)
  );
}

function extractRankingPageMetadata(rawData) {
  const root = findDevalueRankingRoot(rawData);
  if (!root) return {};

  const metadata = root[0] || {};
  const totalCount = Number(resolveRankingReference(root, metadata.totalCount));
  const limit = Number(resolveRankingReference(root, metadata.limit));
  const page = Number(resolveRankingReference(root, metadata.page));

  return {
    totalCount: Number.isFinite(totalCount) && totalCount > 0 ? totalCount : null,
    limit: Number.isFinite(limit) && limit > 0 ? limit : null,
    page: Number.isFinite(page) && page > 0 ? page : null
  };
}

function extractRankingPlayers(rawData) {
  const devaluePlayers = extractDevalueRankingPlayers(rawData);
  if (devaluePlayers) return devaluePlayers;

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
  return dedupeRankingPlayers(results);
}

function getRankingCache() {
  try {
    return JSON.parse(localStorage.getItem(RANKING_CACHE_KEY));
  } catch {
    return null;
  }
}

function setRankingCache(players, season = getCurrentRankingSeason()) {
  localStorage.setItem(RANKING_CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    season,
    country: RANKING_CONFIG.country,
    type: RANKING_CONFIG.type,
    limit: RANKING_CONFIG.limit,
    players
  }));
}

async function loadRankingDataWithCache(forceRefresh = false, onProgress = () => {}, season = getCurrentRankingSeason()) {
  const rankingSeason = Math.max(1, Math.round(toFiniteNumberOrNull(season) || getCurrentRankingSeason()));
  const cached = getRankingCache();
  const cacheMatchesConfig =
    cached?.season === rankingSeason &&
    cached?.country === RANKING_CONFIG.country &&
    cached?.type === RANKING_CONFIG.type &&
    cached?.limit === RANKING_CONFIG.limit;
  const cacheIsFresh = cached?.timestamp && Date.now() - cached.timestamp < RANKING_CACHE_MAX_AGE_MS;

  if (!forceRefresh && cacheMatchesConfig && cacheIsFresh && Array.isArray(cached.players)) {
    console.info("CPL ranking data loaded from cache", { season: rankingSeason, count: cached.players.length });
    onProgress(`Using cached ranking data (${cached.players.length} players).`);
    return {
      source: "cache",
      season: rankingSeason,
      players: cached.players
    };
  }

  const players = [];
  const seenRankingKeys = new Set();
  let page = 1;
  let totalPages = null;

  while (page <= RANKING_MAX_PAGES) {
    const progressText = totalPages
      ? `Loading ranking page ${page} of ${totalPages}...`
      : `Loading ranking page ${page}...`;
    onProgress(progressText);

    const rawPage = await fetchRankingPage(page, rankingSeason);
    const metadata = extractRankingPageMetadata(rawPage);

    if (!totalPages && metadata.totalCount) {
      const pageLimit = metadata.limit || RANKING_CONFIG.limit;
      totalPages = Math.min(RANKING_MAX_PAGES, Math.ceil(metadata.totalCount / pageLimit));
    }

    const pagePlayers = extractRankingPlayers(rawPage);
    const newPagePlayers = pagePlayers.filter(player => {
      const id = String(firstDefined(player, ["id", "playerId", "player.id"]));
      const teamId = String(firstDefined(player, ["teamId", "team.id", "teamID"]));
      const key = `${id}:${teamId}`;

      if (seenRankingKeys.has(key)) return false;
      seenRankingKeys.add(key);
      return true;
    });

    players.push(...newPagePlayers);
    console.info("CPL ranking page loaded", {
      season: rankingSeason,
      page,
      count: pagePlayers.length,
      newCount: newPagePlayers.length,
      totalPages,
      total: players.length
    });

    if (totalPages && page >= totalPages) {
      break;
    }

    if (!totalPages && pagePlayers.length < RANKING_CONFIG.limit) {
      break;
    }

    if (pagePlayers.length === 0 || (!totalPages && newPagePlayers.length === 0)) {
      break;
    }

    page++;
    await delay(RANKING_REQUEST_DELAY_MS);
  }

  if (page > RANKING_MAX_PAGES) {
    console.warn("CPL ranking loading stopped at safety page limit", { limit: RANKING_MAX_PAGES });
  }

  if (!players.length) {
    throw new Error("Ranking data loaded, but no player entries could be parsed.");
  }

  setRankingCache(players, rankingSeason);
  console.info("CPL ranking data loaded from API", { season: rankingSeason, count: players.length });

  return {
    source: "api",
    season: rankingSeason,
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
  return fetchJsonWithRetry(`${CPL_PROXY_BASE}/players/${encodeURIComponent(playerId)}`, {
    headers: {
      "Accept": "application/json"
    }
  }, `Player ${playerId}`);
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

function normalizeSpecialName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function getPlayerSpecialNames(player) {
  return getNamedItemNames(player, "specials")
    .map(normalizeSpecialName)
    .filter(Boolean);
}

function hasSpecialAbility(player, abilityName) {
  const normalizedAbility = normalizeSpecialName(abilityName);
  return getPlayerSpecialNames(player).some(name => name === normalizedAbility);
}

function getPlayerAbilitiesFromSpecials(player) {
  return {
    loyal: hasSpecialAbility(player, "loyal"),
    fragger: hasSpecialAbility(player, "fragger"),
    tryhard: hasSpecialAbility(player, "tryhard")
  };
}

function normalizeCplPlayer(apiPlayer) {
  const id = firstDefined(apiPlayer, ["id", "playerId"]);
  const nick = firstDefined(apiPlayer, ["nick", "nickname", "name"]);
  const name = firstDefined(apiPlayer, ["name", "fullName", "nick", "nickname"]);
  const lineups = Array.isArray(apiPlayer.lineups) ? apiPlayer.lineups : [];
  const abilities = getPlayerAbilitiesFromSpecials(apiPlayer);
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
    loyal: abilities.loyal,
    fragger: abilities.fragger,
    tryhard: abilities.tryhard,
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

function getTransferListUrl() {
  const params = new URLSearchParams({
    age_range: TRANSFER_LIST_CONFIG.ageRange,
    limit: String(TRANSFER_LIST_CONFIG.limit)
  });

  return `${CPL_PROXY_BASE}/transfers?${params.toString()}`;
}

async function fetchTransferList() {
  return fetchJsonWithRetry(getTransferListUrl(), {
    headers: {
      "Accept": "application/json"
    }
  }, "Transfer list");
}

function getTransferListCache() {
  try {
    return JSON.parse(localStorage.getItem(TRANSFER_LIST_CACHE_KEY));
  } catch {
    return null;
  }
}

function setTransferListCache(rawData) {
  try {
    localStorage.setItem(TRANSFER_LIST_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      age_range: TRANSFER_LIST_CONFIG.ageRange,
      limit: TRANSFER_LIST_CONFIG.limit,
      transfers: rawData
    }));
  } catch (error) {
    console.warn("CPL transfer list cache write failed", error);
  }
}

async function loadTransferListWithCache(forceRefresh = false) {
  const cached = getTransferListCache();
  const cacheMatchesConfig =
    cached?.age_range === TRANSFER_LIST_CONFIG.ageRange &&
    cached?.limit === TRANSFER_LIST_CONFIG.limit;
  const cacheIsFresh = cached?.timestamp && Date.now() - cached.timestamp < RANKING_CACHE_MAX_AGE_MS;

  if (!forceRefresh && cacheMatchesConfig && cacheIsFresh && cached.transfers) {
    const players = extractTransferPlayers(cached.transfers);
    console.info("CPL transfer list loaded from localStorage", {
      rawCount: getTransferRawCount(cached.transfers),
      playerCount: players.length
    });

    return {
      source: "localStorage",
      rawData: cached.transfers,
      players
    };
  }

  const rawData = await fetchTransferList();
  setTransferListCache(rawData);
  const players = extractTransferPlayers(rawData);
  console.info("CPL transfer list loaded from proxy", {
    rawCount: getTransferRawCount(rawData),
    playerCount: players.length
  });

  return {
    source: "proxy",
    rawData,
    players
  };
}

function getTransferRawCount(rawData) {
  if (Array.isArray(rawData)) return rawData.length;
  if (Array.isArray(rawData?.transfers)) return rawData.transfers.length;
  if (Array.isArray(rawData?.players)) return rawData.players.length;
  if (Array.isArray(rawData?.data)) return rawData.data.length;
  return 0;
}

function hasSkillData(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  return SKILL_NAMES.some(skillName => {
    const key = skillName.toLowerCase();
    return (
      firstDefined(value, [`${key}SkillLimit`, `skills.${key}.limit`, `skills.${skillName}.limit`]) !== null ||
      firstDefined(value, [`${key}SkillValue`, `skills.${key}.value`, `skills.${skillName}.value`]) !== null
    );
  });
}

function isTransferPlayerLike(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const id = firstDefined(value, ["id", "playerId"]);
  const name = firstDefined(value, ["nick", "name", "nickname"]);
  const hasTotals =
    firstDefined(value, ["totalSkill", "skillTotal"]) !== null ||
    firstDefined(value, ["totalLimit", "limitTotal"]) !== null;

  return id !== null && name !== null && (hasSkillData(value) || hasTotals);
}

function mergeTransferPlayer(transfer, player) {
  if (!transfer || transfer === player) return player;

  return {
    ...player,
    transferId: firstDefined(transfer, ["transferId", "id"]),
    startBid: firstDefined(transfer, ["startBid"]),
    deadline: firstDefined(transfer, ["deadline"]),
    sellingTeamId: firstDefined(transfer, ["sellingTeamId", "sellingTeam.id"]),
    transferStatus: firstDefined(transfer, ["status"]),
    transfer
  };
}

function addTransferCandidate(playerMap, candidate) {
  if (!isTransferPlayerLike(candidate)) return;

  const id = firstDefined(candidate, ["id", "playerId"]);
  if (id === null) return;

  const key = String(id);
  playerMap.set(key, {
    ...playerMap.get(key),
    ...candidate
  });
}

function extractTransferPlayers(rawData) {
  const playerMap = new Map();
  const visited = new WeakSet();

  function visit(value, parent = null) {
    if (!value || typeof value !== "object" || visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach(item => visit(item, parent));
      return;
    }

    if (value.player && typeof value.player === "object") {
      addTransferCandidate(playerMap, mergeTransferPlayer(value, value.player));
    } else {
      addTransferCandidate(playerMap, parent ? mergeTransferPlayer(parent, value) : value);
    }

    Object.values(value).forEach(child => visit(child, value));
  }

  visit(rawData);
  return Array.from(playerMap.values());
}

function getNamedItemNames(player, fieldName) {
  const items = firstDefined(player, [fieldName]) || [];

  if (!Array.isArray(items)) return [];

  return items
    .map(item => String(
      item?.name ??
      item?.title ??
      item?.label ??
      item?.slug ??
      item?.key ??
      item?.code ??
      item ??
      ""
    ).trim().toLowerCase())
    .filter(Boolean);
}

function getTransferSpecialNames(player) {
  return getPlayerSpecialNames(player);
}

function hasTransferAbility(player, abilityName) {
  return hasSpecialAbility(player, abilityName);
}

function getTransferPlayerAbilities(player) {
  return {
    loyal: hasTransferAbility(player, "loyal"),
    fragger: hasTransferAbility(player, "fragger"),
    tryhard: hasTransferAbility(player, "tryhard")
  };
}

function hasTransferFireHeart(player) {
  return getTransferSpecialNames(player).some(name =>
    name === "fire-heart" ||
    name === "fireheart" ||
    (name.includes("fire") && name.includes("heart"))
  );
}

function getTransferHeartBonus(player) {
  return hasTransferFireHeart(player) ? 0.04 : 0;
}

function getTransferFixedSkillModifiers(player) {
  const modifiers = firstDefined(player, ["skillModifiers"]) || [];
  const modifierBySkill = {};

  if (!Array.isArray(modifiers)) return modifierBySkill;

  modifiers.forEach(modifier => {
    const skillKey = String(modifier?.skillName || "").trim().toLowerCase();
    const value = Number(modifier?.modifierValue);
    const valueType = String(modifier?.valueType || "").toLowerCase();

    if (!skillKey || !Number.isFinite(value) || valueType !== "fixed") return;
    if (!SKILL_NAMES.map(skillName => skillName.toLowerCase()).includes(skillKey)) return;

    modifierBySkill[skillKey] = (modifierBySkill[skillKey] || 0) + value;
  });

  return modifierBySkill;
}

function sumSkillField(player, suffix) {
  const values = SKILL_NAMES.map(skillName => {
    const value = Number(player[`${skillName.toLowerCase()}Skill${suffix}`]);
    return Number.isFinite(value) ? value : null;
  });

  return values.every(value => value !== null)
    ? values.reduce((total, value) => total + value, 0)
    : null;
}

function stripTransferLocalSkillModifiers(player) {
  const fixedModifiers = getTransferFixedSkillModifiers(player);
  const sanitized = {
    ...player,
    skillModifiers: [],
    globalModifiers: []
  };

  SKILL_NAMES.forEach(skillName => {
    const skillKey = skillName.toLowerCase();
    const modifier = fixedModifiers[skillKey] || 0;

    if (!modifier) return;

    ["Value", "Limit"].forEach(suffix => {
      const fieldName = `${skillKey}Skill${suffix}`;
      const value = Number(sanitized[fieldName]);

      if (Number.isFinite(value)) {
        sanitized[fieldName] = Math.max(0, value - modifier);
      }
    });
  });

  const totalSkill = sumSkillField(sanitized, "Value");
  const totalLimit = sumSkillField(sanitized, "Limit");

  if (totalSkill !== null) {
    sanitized.totalSkill = totalSkill;
  }

  if (totalLimit !== null) {
    sanitized.totalLimit = totalLimit;
  }

  return sanitized;
}

function normalizeTransferPlayer(rawPlayer) {
  const comparisonPlayer = stripTransferLocalSkillModifiers(rawPlayer);
  const importedPlayer = normalizeCplPlayer(comparisonPlayer);
  const abilities = getTransferPlayerAbilities(rawPlayer);
  const currentHeartBonus = getTransferHeartBonus(rawPlayer);
  const heartMode = hasTransferFireHeart(rawPlayer) ? "constant4" : "progressive";

  return {
    ...importedPlayer,
    source: "transferList",
    transferId: firstDefined(rawPlayer, ["transferId"]),
    startBid: firstDefined(rawPlayer, ["startBid"]),
    deadline: firstDefined(rawPlayer, ["deadline"]),
    sellingTeamId: firstDefined(rawPlayer, ["sellingTeamId"]),
    startGames: 0,
    heartMode,
    loyal: abilities.loyal,
    fragger: abilities.fragger,
    tryhard: abilities.tryhard,
    currentHeartBonus,
    fireHeart: heartMode === "constant4",
    rawTransferPlayer: rawPlayer
  };
}

function getCplPlayerUrl(player) {
  const playerId = firstDefined(player, ["id", "playerId"]);
  const teamId = firstDefined(player, ["teamId", "team.id", "sellingTeamId"]);

  if (!teamId) {
    return `https://www.cplmanager.com/cpl/teams/free-agent/players/${encodeURIComponent(playerId)}`;
  }

  return `https://www.cplmanager.com/cpl/teams/${encodeURIComponent(teamId)}/players/${encodeURIComponent(playerId)}`;
}

function getWeakestComparedPlayerByAverage(comparedPlayers) {
  return comparedPlayers
    .map(player => {
      const averageScore = getProjectionAverageScore(player.projection);

      return player.projection?.length
        ? { player, averageScore, value: averageScore }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.value - b.value)[0] || null;
}

function normalizePlayerIdentityValue(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getPlayerIdentityKeys(player) {
  const keys = [];
  const playerId = firstDefined(player, ["cplPlayerId", "id", "playerId"]);

  if (playerId !== null) {
    keys.push(`id:${String(playerId)}`);
  }

  [
    player.playerName,
    player.name,
    player.nick
  ].forEach(value => {
    const normalized = normalizePlayerIdentityValue(value);
    if (normalized) keys.push(`name:${normalized}`);
  });

  return keys;
}

function getComparedPlayerIdentitySet(comparedPlayers) {
  const identities = new Set();

  comparedPlayers.forEach(player => {
    getPlayerIdentityKeys(player).forEach(key => identities.add(key));
  });

  return identities;
}

function isComparedPlayerSuggestion(player, comparedIdentities) {
  return getPlayerIdentityKeys(player).some(key => comparedIdentities.has(key));
}

function getTopSkillLimitText(player, selectedSkills, maxItems = 3) {
  const parsed = parsePlayerText(player.text || "");

  return parsed.skills
    .filter(skill => selectedSkills.includes(skill.name) && Number.isFinite(Number(skill.max)))
    .sort((a, b) => Number(b.max) - Number(a.max))
    .slice(0, maxItems)
    .map(skill => `${skill.name} ${skill.max}`)
    .join(", ");
}

function getRelevantSpecialLabels(player) {
  const labels = [];

  if (player.fragger) labels.push("Fragger");
  if (player.tryhard) labels.push("Tryhard");
  if (player.loyal) labels.push("Loyal");
  if (player.fireHeart) labels.push("Fire Heart 4.0%");

  return labels;
}

function calculateTransferSuggestions({
  transferPlayers,
  comparedPlayers,
  seasonCount,
  gamesPerSeason,
  selectedSkills,
  weights,
  weightsEnabled,
  applyAgeDecay,
  useAnalysisFeature,
  baseSeasonState,
  limit = TRANSFER_SUGGESTION_LIMIT
}) {
  if (!Array.isArray(comparedPlayers) || comparedPlayers.length < 1) {
    return {
      weakest: null,
      normalizedPlayers: [],
      suggestions: []
    };
  }

  const weakest = getWeakestComparedPlayerByAverage(comparedPlayers);
  if (!weakest) {
    return {
      weakest: null,
      normalizedPlayers: [],
      suggestions: []
    };
  }

  const normalizedPlayers = transferPlayers
    .map(rawPlayer => {
      try {
        return normalizeTransferPlayer(rawPlayer);
      } catch (error) {
        console.warn("CPL transfer player normalization failed", { rawPlayer, error });
        return null;
      }
    })
    .filter(player => player?.text);
  const comparedIdentities = getComparedPlayerIdentitySet(comparedPlayers);

  const suggestions = normalizedPlayers
    .filter(player => !isComparedPlayerSuggestion(player, comparedIdentities))
    .map(player => {
      const parsedPlayer = parsePlayerText(player.text);
      if (!parsedPlayer.skills.length) return null;

      const projection = buildProjection(
        parsedPlayer,
        selectedSkills,
        player.startGames || 0,
        player.heartMode || "progressive",
        gamesPerSeason,
        seasonCount,
        !!player.loyal,
        weights,
        weightsEnabled,
        {
          fragger: !!player.fragger,
          tryhard: !!player.tryhard
        },
        applyAgeDecay,
        useAnalysisFeature,
        baseSeasonState
      );

      if (!projection.length) return null;

      const averageScore = getProjectionAverageScore(projection);
      const finalPoint = projection[projection.length - 1];
      const improvement = averageScore - weakest.value;
      if (improvement <= 0) return null;

      return {
        player,
        parsedPlayer,
        projection,
        averageScore,
        finalPoint,
        improvement,
        improvementPercent: weakest.value > 0 ? improvement / weakest.value : 0,
        cplUrl: getCplPlayerUrl(player),
        topSkillText: getTopSkillLimitText(player, selectedSkills),
        specialLabels: getRelevantSpecialLabels(player)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, limit);

  return {
    weakest,
    normalizedPlayers,
    suggestions
  };
}

function renderTransferSuggestionsLoading() {
  const container = document.getElementById("transfer-suggestions");
  if (!container) return;

  container.hidden = false;
  container.innerHTML = `
    <h2>Transfer List Suggestions</h2>
    <p class="transfer-suggestion-status">Loading transfer list...</p>
  `;
}

function clearTransferSuggestions() {
  const container = document.getElementById("transfer-suggestions");
  transferSuggestionState.requestId += 1;
  transferSuggestionState.suggestions = [];

  if (!container) return;

  container.hidden = true;
  container.innerHTML = "";
}

function renderTransferSuggestionsWarning(message) {
  const container = document.getElementById("transfer-suggestions");
  if (!container) return;

  container.hidden = false;
  container.innerHTML = `
    <h2>Transfer List Suggestions</h2>
    <p class="transfer-suggestion-warning">${escapeHtml(message)}</p>
  `;
}

function renderTransferSuggestions(result, context = {}) {
  const container = document.getElementById("transfer-suggestions");
  if (!container) return;

  transferSuggestionState.suggestions = result.suggestions;

  if (!result.weakest) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  container.hidden = false;
  const weakestStartPoint = result.weakest.player.projection[0];
  const weakestEndPoint = result.weakest.player.projection[result.weakest.player.projection.length - 1];
  const weakestRangeLabel = `${getProjectionPointLabel(weakestStartPoint)}-${getProjectionPointLabel(weakestEndPoint)}`;

  if (!result.suggestions.length) {
    container.innerHTML = `
      <h2>Transfer List Suggestions</h2>
      <p class="transfer-suggestion-status">No better transfer-list players found for the current settings.</p>
      <p class="transfer-suggestion-status">Average target: ${escapeHtml(result.weakest.player.playerName)} across ${escapeHtml(weakestRangeLabel)}.</p>
    `;
    return;
  }

  const suggestionCards = result.suggestions.map((suggestion, index) => {
    const player = suggestion.player;
    const displayName = player.name || player.nick || "Unknown Player";
    const nick = player.nick && player.nick !== displayName ? ` (${player.nick})` : "";
    const teamText = player.teamId ? `Team ${player.teamId}` : "Free Agent";
    const totalText = `${player.totalSkill ?? "?"} / ${player.totalLimit ?? "?"}`;
    const specialText = suggestion.specialLabels.length ? suggestion.specialLabels.join(", ") : "-";
    const skillText = suggestion.topSkillText || "-";
    const suggestionRangeLabel = `${getProjectionPointLabel(suggestion.projection[0])}-${getProjectionPointLabel(suggestion.finalPoint)}`;

    return `
      <article class="transfer-suggestion-card">
        <div class="transfer-suggestion-rank">#${index + 1}</div>
        <div class="transfer-suggestion-main">
          <strong>${escapeHtml(displayName)}${escapeHtml(nick)}</strong>
          <span>${escapeHtml(teamText)} - Age ${escapeHtml(player.age ?? "?")}</span>
        </div>
        <div class="transfer-suggestion-metric">
          <span>Total</span>
          <strong>${escapeHtml(totalText)}</strong>
        </div>
        <div class="transfer-suggestion-metric">
          <span>Avg ${escapeHtml(suggestionRangeLabel)}</span>
          <strong>${suggestion.averageScore.toFixed(2)}</strong>
        </div>
        <div class="transfer-suggestion-metric summary-positive">
          <span>Avg gain</span>
          <strong>+${suggestion.improvement.toFixed(2)} (${(suggestion.improvementPercent * 100).toFixed(1)}%)</strong>
        </div>
        <div class="transfer-suggestion-detail">
          <span>Specials: ${escapeHtml(specialText)}</span>
          <span>Top limits: ${escapeHtml(skillText)}</span>
        </div>
        <div class="transfer-suggestion-actions">
          <a href="${escapeHtml(suggestion.cplUrl)}" target="_blank" rel="noopener noreferrer">Open in CPL</a>
          <button type="button" class="transfer-load-button" data-player-id="${escapeHtml(player.id)}">Load into Tool</button>
        </div>
      </article>
    `;
  }).join("");

  container.innerHTML = `
    <h2>Transfer List Suggestions</h2>
    <div class="transfer-suggestion-meta">
      <span>Average target: <strong>${escapeHtml(result.weakest.player.playerName)}</strong> (${result.weakest.value.toFixed(2)}) across ${escapeHtml(weakestRangeLabel)}</span>
      <span>Source: ${escapeHtml(context.source || "localStorage")} - ${result.normalizedPlayers.length} valid transfer players</span>
    </div>
    <div class="transfer-suggestion-list">
      ${suggestionCards}
    </div>
    <p class="transfer-suggestion-status" data-transfer-save-status></p>
  `;
}

async function updateTransferSuggestionsForComparison(comparedPlayers, comparisonSettings) {
  const requestId = transferSuggestionState.requestId + 1;
  transferSuggestionState.requestId = requestId;
  transferSuggestionState.suggestions = [];
  renderTransferSuggestionsLoading();

  try {
    const transferResult = await loadTransferListWithCache(false);
    if (requestId !== transferSuggestionState.requestId) return;

    const suggestionResult = calculateTransferSuggestions({
      transferPlayers: transferResult.players,
      comparedPlayers,
      ...comparisonSettings
    });

    console.info("CPL transfer suggestions calculated", {
      source: transferResult.source,
      transferPlayersFound: transferResult.players.length,
      validNormalizedPlayers: suggestionResult.normalizedPlayers.length,
      weakestComparedPlayer: suggestionResult.weakest
        ? {
            name: suggestionResult.weakest.player.playerName,
            averageScore: suggestionResult.weakest.value
          }
        : null,
      suggestions: suggestionResult.suggestions.length
    });

    renderTransferSuggestions(suggestionResult, {
      source: transferResult.source,
      seasonCount: comparisonSettings.seasonCount
    });
  } catch (error) {
    console.warn("CPL transfer suggestions failed", error);
    if (requestId === transferSuggestionState.requestId) {
      renderTransferSuggestionsWarning(error?.message || "Transfer list suggestions failed.");
    }
  }
}

function saveImportedPlayer(player) {
  saveImportedPlayers([player]);
  return player;
}

function handleTransferSuggestionClick(event) {
  const button = event.target.closest(".transfer-load-button");
  if (!button) return;

  const playerId = button.dataset.playerId;
  const suggestion = transferSuggestionState.suggestions.find(item => String(item.player.id) === String(playerId));
  const status = document.querySelector("[data-transfer-save-status]");

  if (!suggestion) {
    if (status) status.textContent = "Transfer player is no longer available in the current suggestions.";
    return;
  }

  const savedPlayer = saveImportedPlayer(suggestion.player);
  if (status) {
    status.textContent = `Saved ${savedPlayer.nick || savedPlayer.name} to the player dropdown.`;
  }
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

      if (targetId === "community-stats-view") {
        ensureCommunityStatsLoaded();
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
    text: player.text,
    startGames: player.startGames,
    heartMode: player.heartMode,
    loyal: player.loyal,
    fragger: player.fragger,
    tryhard: player.tryhard
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
      setTeamImportStatus(`Loading player ${index + 1} of ${playerIds.length} details...`, "loading");

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

function buildCommunityDataUrl() {
  return `${CPL_PROXY_BASE}/communities/${COMMUNITY_ID}`;
}

function buildLadderDataUrl(ladderId) {
  return `${CPL_PROXY_BASE}/ladders/${encodeURIComponent(ladderId)}`;
}

function buildChampionshipDataUrl(season) {
  return `${CPL_PROXY_BASE}/championships/${encodeURIComponent(season)}/__data.json?x-sveltekit-invalidated=001`;
}

function buildOfficialTournamentsDataUrl() {
  return `${CPL_PROXY_BASE}/tournaments/official/__data.json`;
}

function buildTournamentDetailDataUrl(tournamentId) {
  return `${CPL_PROXY_BASE}/api/tournaments/${encodeURIComponent(tournamentId)}`;
}

function buildCplMatchUrl(matchId) {
  return matchId ? `https://www.cplmanager.com/cpl/matches/${encodeURIComponent(matchId)}/` : "";
}

const COMMUNITY_DEMO_TEAMS = [
  { teamId: 4355, teamName: "P1XELS", username: "pixie", ranking: 39, leaguePosition: 2, division: 3, fame: 14620, ladderPosition: 1, color: "#ff7a00" },
  { teamId: 3147, teamName: "Joy Division", username: "joyce", ranking: 44, leaguePosition: 4, division: 3, fame: 13880, ladderPosition: 2, color: "#4d8cff" },
  { teamId: 1394, teamName: "Gruene Mediziner", username: "doc", ranking: 21, leaguePosition: 1, division: 2, fame: 16940, ladderPosition: 3, color: "#3aa65b" },
  { teamId: 2522, teamName: "King of Queens", username: "queen", ranking: 70, leaguePosition: 7, division: 4, fame: 11210, ladderPosition: 4, color: "#9b66d9" },
  { teamId: 143, teamName: "C64", username: "retro", ranking: 85, leaguePosition: 9, division: 4, fame: 10440, ladderPosition: 5, color: "#54b6c8" },
  { teamId: 3277, teamName: "Trick Siebzehn", username: "trick", ranking: 55, leaguePosition: 5, division: 3, fame: 12770, ladderPosition: 6, color: "#d08b36" }
];

const COMMUNITY_DEMO_PLAYER_TEMPLATES = [
  { name: "Kanat Mukhamedov", nick: "eren", games: 53, kills: 1100, deaths: 816, headshots: 435, mvps: 14 },
  { name: "Nico Hartmann", nick: "n1co", games: 49, kills: 920, deaths: 708, headshots: 380, mvps: 9 },
  { name: "Lena Sommer", nick: "sunny", games: 51, kills: 860, deaths: 690, headshots: 346, mvps: 11 },
  { name: "Mika Brandt", nick: "miq", games: 46, kills: 740, deaths: 602, headshots: 281, mvps: 7 },
  { name: "Timo Weber", nick: "twb", games: 44, kills: 705, deaths: 660, headshots: 248, mvps: 5 },
  { name: "Jonas Klein", nick: "jkay", games: 41, kills: 640, deaths: 611, headshots: 221, mvps: 4 },
  { name: "Sara Becker", nick: "sabe", games: 48, kills: 790, deaths: 650, headshots: 332, mvps: 8 },
  { name: "Alex Vogel", nick: "av0", games: 43, kills: 690, deaths: 632, headshots: 250, mvps: 6 },
  { name: "Ben Richter", nick: "br7", games: 45, kills: 720, deaths: 678, headshots: 259, mvps: 5 },
  { name: "Mara Stein", nick: "mara", games: 39, kills: 590, deaths: 554, headshots: 205, mvps: 3 },
  { name: "Finn Adler", nick: "fin", games: 42, kills: 615, deaths: 590, headshots: 216, mvps: 4 },
  { name: "Noah Wolf", nick: "nwolf", games: 38, kills: 540, deaths: 520, headshots: 194, mvps: 2 }
];

function getCommunityDemoTournamentData(season) {
  const teams = getCommunityDemoData().teams;
  const trick = teams.find(team => Number(team.teamId) === 3277) || teams[0];
  const medics = teams.find(team => Number(team.teamId) === 1394) || teams[1] || trick;

  return {
    championship: [
      {
        id: 3124,
        name: `Thunderstruck Contenders Season ${season}`,
        status: "playing",
        type: "contenders",
        season,
        tier: null,
        winnerId: null,
        sponsor: "Thunderstruck",
        teams: [
          {
            teamId: trick.teamId,
            position: 9,
            winsCount: 4,
            drawsCount: 0,
            lossesCount: 2,
            points: 12,
            roundDifference: 17,
            team: {
              id: trick.teamId,
              name: "TRICK SIEBZEHN",
              logoUrl: trick.logoUrl,
              communityTag: "BLZ"
            }
          }
        ],
        stages: [
          {
            id: 90001,
            name: "Swiss format",
            status: "finished",
            teams: [
              {
                teamId: trick.teamId,
                position: 9,
                gamesCount: 6,
                winsCount: 4,
                drawsCount: 0,
                lossesCount: 2,
                points: 12,
                roundDifference: 17
              }
            ],
            matches: [
              {
                id: 989701,
                tournamentId: 3124,
                stageName: "Swiss format",
                roundName: "Round 6",
                status: "processed",
                date: "2026-06-12T15:00:00.000Z",
                map: "train_v2",
                homeTeamId: trick.teamId,
                awayTeamId: 4216,
                homeTeamRounds: 16,
                awayTeamRounds: 11,
                homeTeam: { id: trick.teamId, name: "TRICK SIEBZEHN" },
                awayTeam: { id: 4216, name: "Puddin Pops" }
              }
            ]
          },
          {
            id: 90002,
            name: "Playoffs",
            status: "playing",
            matches: [
              {
                id: 989799,
                tournamentId: 3124,
                stageName: "Playoffs",
                roundName: "Quarterfinal",
                status: "pending",
                date: "2026-06-21T18:00:00.000Z",
                map: "mirage_v2",
                homeTeamId: 3742,
                awayTeamId: trick.teamId,
                homeTeam: { id: 3742, name: "BARBARIKI" },
                awayTeam: { id: trick.teamId, name: "TRICK SIEBZEHN" }
              }
            ]
          }
        ]
      }
    ],
    eos: [
      {
        id: 4112,
        name: `Cyber X Series Season ${season}`,
        status: "playing",
        type: "series",
        season,
        tier: 3,
        winnerId: null,
        sponsor: "Cyber X",
        teams: [
          {
            teamId: medics.teamId,
            position: 5,
            winsCount: 3,
            drawsCount: 1,
            lossesCount: 1,
            points: 10,
            roundDifference: 8,
            team: {
              id: medics.teamId,
              name: medics.teamName,
              logoUrl: medics.logoUrl,
              communityTag: "BLZ"
            }
          }
        ],
        stages: [
          {
            id: 91001,
            name: "Group stage",
            status: "playing",
            teams: [
              {
                teamId: medics.teamId,
                position: 5,
                gamesCount: 5,
                winsCount: 3,
                drawsCount: 1,
                lossesCount: 1,
                points: 10,
                roundDifference: 8
              }
            ],
            matches: [
              {
                id: 990112,
                tournamentId: 4112,
                stageName: "Group stage",
                roundName: "Round 5",
                status: "pending",
                date: "2026-06-22T17:00:00.000Z",
                map: "ancient_v2",
                homeTeamId: medics.teamId,
                awayTeamId: 4969,
                homeTeam: { id: medics.teamId, name: medics.teamName },
                awayTeam: { id: 4969, name: "Fallen Angels" }
              }
            ]
          }
        ]
      }
    ]
  };
}


function getCommunityDemoData() {
  return {
    name: `Community ${COMMUNITY_ID} Demo`,
    teams: COMMUNITY_DEMO_TEAMS.map(team => {
      const divisionName = getDivisionName(team.division);

      return {
        ...team,
        logoUrl: buildDemoLogoDataUrl(team.teamName, team.color),
        divisionIconUrl: buildDemoDivisionIconDataUrl(divisionName)
      };
    })
  };
}

function getCommunityDemoLadderData(ladderId) {
  return {
    id: ladderId,
    teams: COMMUNITY_DEMO_TEAMS.map(team => ({
      teamId: team.teamId,
      position: team.ladderPosition,
      points: Math.max(0, 720 - team.ladderPosition * 24)
    }))
  };
}

function getCommunityDemoRankingPlayers(teams) {
  const availableTeams = Array.isArray(teams) && teams.length ? teams : normalizeCommunityTeams(getCommunityDemoData());

  return COMMUNITY_DEMO_PLAYER_TEMPLATES.map((player, index) => {
    const team = availableTeams[index % availableTeams.length];
    const kdRatio = player.deaths ? player.kills / player.deaths : 0;
    const hsPercentage = player.kills ? (player.headshots / player.kills) * 100 : 0;

    return {
      id: `${team.teamId}${index + 101}`,
      teamId: team.teamId,
      rank: index + 1,
      name: player.name,
      nick: player.nick,
      stat: {
        games: player.games,
        kills: player.kills,
        deaths: player.deaths,
        headshots: player.headshots,
        mvps: player.mvps,
        kdRatio,
        hsPercentage
      }
    };
  });
}

function getCommunityStatsCache() {
  try {
    return JSON.parse(localStorage.getItem(COMMUNITY_CACHE_KEY));
  } catch {
    return null;
  }
}

function setCommunityStatsCache(payload) {
  localStorage.setItem(COMMUNITY_CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    communityId: COMMUNITY_ID,
    ...payload
  }));
}

function getFreshCommunityStatsCache(season, ladderId) {
  const cached = getCommunityStatsCache();
  const cacheIsFresh = cached?.timestamp && Date.now() - cached.timestamp < COMMUNITY_CACHE_MAX_AGE_MS;

  if (
    cacheIsFresh &&
    cached.communityId === COMMUNITY_ID &&
    cached.season === season &&
    cached.ladderId === ladderId &&
    cached.communityData
  ) {
    return cached;
  }

  return null;
}

function getCommunityRankingBaselines() {
  try {
    const stored = JSON.parse(localStorage.getItem(COMMUNITY_RANKING_BASELINES_KEY));
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function setCommunityRankingBaselines(baselines) {
  localStorage.setItem(COMMUNITY_RANKING_BASELINES_KEY, JSON.stringify(baselines));
}

function getCommunityRankingBaseline(season) {
  const seasonKey = String(season);
  const stored = getCommunityRankingBaselines();

  return stored[seasonKey] || SEEDED_COMMUNITY_RANKING_BASELINES[season] || null;
}

function getBaselineRankingForTeam(baseline, team) {
  if (!baseline || !team) return null;
  const byId = baseline.teams?.[String(team.teamId)] || baseline.teams?.[team.teamId];
  const ranking = toFiniteNumberOrNull(byId?.ranking ?? byId);

  if (ranking !== null) return ranking;

  const normalizedTeamName = normalizeSearchValue(team.teamName);
  const matchingEntry = Object.values(baseline.teams || {}).find(entry => (
    entry &&
    typeof entry === "object" &&
    normalizeSearchValue(entry.teamName) === normalizedTeamName
  ));

  return toFiniteNumberOrNull(matchingEntry?.ranking);
}

function applyCommunityRankingTrends(teams, seasonState) {
  const previousSeason = seasonState.season - 1;
  const baseline = getCommunityRankingBaseline(previousSeason);

  return teams.map(team => {
    const currentRanking = toFiniteNumberOrNull(team.ranking);
    const previousRanking = getBaselineRankingForTeam(baseline, team);
    const rankingDelta = previousRanking !== null && currentRanking !== null
      ? previousRanking - currentRanking
      : null;
    const rankingTrend = rankingDelta === null
      ? "unknown"
      : rankingDelta > 0
        ? "up"
        : rankingDelta < 0
          ? "down"
          : "same";

    return {
      ...team,
      previousRanking,
      rankingDelta,
      rankingTrend,
      rankingBaselineSeason: baseline ? previousSeason : null
    };
  });
}

function saveCommunityRankingBaselineIfSeasonEnd(seasonState, teams) {
  if (seasonState.seasonDay !== CPL_SEASON_DAYS || !teams.length) return;

  const seasonKey = String(seasonState.season);
  const baselines = getCommunityRankingBaselines();
  const teamEntries = {};

  teams.forEach(team => {
    const ranking = toFiniteNumberOrNull(team.ranking);
    if (ranking === null) return;

    teamEntries[String(team.teamId)] = {
      teamName: team.teamName,
      ranking
    };
  });

  if (!Object.keys(teamEntries).length) return;

  baselines[seasonKey] = {
    season: seasonState.season,
    seasonDay: seasonState.seasonDay,
    savedAt: new Date().toISOString(),
    teams: teamEntries
  };

  setCommunityRankingBaselines(baselines);
}

function isCommunityTeamLike(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const teamId = firstDefined(value, ["teamId", "team.id", "id"]);
  const teamName = firstDefined(value, ["teamName", "name", "team.name"]);

  return teamId !== null && teamName !== null;
}

function isLadderEntryLike(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const teamId = firstDefined(value, ["teamId", "team.id"]);
  const ladderValue = firstDefined(value, ["position", "ladderPosition", "points", "ladderPoints"]);

  return teamId !== null && ladderValue !== null;
}

function getCommunityTeamArray(rawData) {
  return getArrayCandidate(rawData, [
    "teams",
    "communityTeams",
    "community.teams",
    "data.teams",
    "result.teams"
  ]) || findArrayByEntryShape(rawData, isCommunityTeamLike) || [];
}

function getLadderEntryArray(rawData) {
  return getArrayCandidate(rawData, [
    "teams",
    "entries",
    "participants",
    "ladderTeams",
    "data.teams",
    "result.teams"
  ]) || findArrayByEntryShape(rawData, isLadderEntryLike) || [];
}

function getCommunityTournamentCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(COMMUNITY_TOURNAMENT_CACHE_KEY));
    return cached && typeof cached === "object" ? cached : {};
  } catch {
    return {};
  }
}

function getFreshCommunityTournamentCacheEntry(key) {
  const entry = getCommunityTournamentCache()[key];
  const cacheIsFresh = entry?.timestamp && Date.now() - entry.timestamp < COMMUNITY_TOURNAMENT_CACHE_MAX_AGE_MS;
  return cacheIsFresh ? entry.payload : null;
}

function setCommunityTournamentCacheEntry(key, payload) {
  const cached = getCommunityTournamentCache();
  cached[key] = {
    timestamp: Date.now(),
    payload
  };
  localStorage.setItem(COMMUNITY_TOURNAMENT_CACHE_KEY, JSON.stringify(cached));
}

function resolveSvelteIndex(root, index, seen) {
  if (seen.has(index)) return seen.get(index);

  const value = root[index];
  if (value === -1) return null;

  if (!value || typeof value !== "object") {
    return value;
  }

  const placeholder = Array.isArray(value) ? [] : {};
  seen.set(index, placeholder);
  const resolved = resolveSvelteValue(root, value, seen);
  seen.set(index, resolved);
  return resolved;
}

function resolveSvelteValue(root, value, seen = new Map()) {
  if (value === -1) return null;

  if (Number.isInteger(value) && value >= 0 && value < root.length) {
    return resolveSvelteIndex(root, value, seen);
  }

  if (Array.isArray(value)) {
    if (value[0] === "Date") {
      return value[1] || null;
    }

    return value.map(item => resolveSvelteValue(root, item, seen));
  }

  if (!value || typeof value !== "object") return value;

  const result = {};
  Object.entries(value).forEach(([key, child]) => {
    result[key] = resolveSvelteValue(root, child, seen);
  });
  return result;
}

function getDecodedSvelteDataRoots(rawData) {
  const roots = [];
  const nodes = Array.isArray(rawData?.nodes) ? rawData.nodes : [];

  nodes.forEach(node => {
    if (Array.isArray(node?.data)) {
      roots.push(resolveSvelteIndex(node.data, 0, new Map()));
    }
  });

  return roots.length ? roots : [rawData];
}

function isTournamentLikeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const id = toFiniteNumberOrNull(value.id ?? value.tournamentId);
  if (id === null) return false;

  const signals = [
    value.name,
    value.season,
    value.type,
    value.status,
    value.tier,
    value.sponsor,
    value.format,
    value.logoUrl,
    value.teams,
    value.participants,
    value.winnerId,
    value.maxSlots
  ].filter(value => value !== undefined && value !== null && value !== "").length;

  return Boolean(value.name) && signals >= 3 && !("userId" in value && !("season" in value));
}

function collectTournamentObjects(value, results = [], visited = new WeakSet()) {
  if (!value || typeof value !== "object" || visited.has(value)) return results;
  visited.add(value);

  if (isTournamentLikeObject(value)) {
    results.push(value);
  }

  const children = Array.isArray(value) ? value : Object.values(value);
  children.forEach(child => collectTournamentObjects(child, results, visited));
  return results;
}

function uniqueTournamentSummaries(tournaments, season = null) {
  const seen = new Set();

  return tournaments
    .map(tournament => ({
      id: toFiniteNumberOrNull(tournament.tournamentId ?? tournament.id),
      name: tournament.name || "",
      season: toFiniteNumberOrNull(tournament.season),
      type: tournament.type || "",
      tier: toFiniteNumberOrNull(tournament.tier),
      status: tournament.status || "",
      sponsor: tournament.sponsor || "",
      logoUrl: tournament.logoUrl || ""
    }))
    .filter(tournament => {
      if (tournament.id === null) return false;
      if (season !== null && tournament.season !== null && tournament.season !== season) return false;
      if (seen.has(tournament.id)) return false;
      seen.add(tournament.id);
      return true;
    });
}

function extractTournamentSummariesFromData(data, season = null) {
  const roots = getDecodedSvelteDataRoots(data);
  const tournaments = roots.flatMap(root => collectTournamentObjects(root));
  return uniqueTournamentSummaries(tournaments, season);
}

function extractTournamentIdsFromChampionshipData(data) {
  return extractTournamentSummariesFromData(data).map(tournament => tournament.id);
}

function extractTournamentIdsFromOfficialData(data, season) {
  return extractTournamentSummariesFromData(data, season).map(tournament => tournament.id);
}

function sanitizePublicTeam(rawTeam, fallbackTeamId = null) {
  const teamId = toFiniteNumberOrNull(firstDefined(rawTeam, ["id", "teamId"])) ?? toFiniteNumberOrNull(fallbackTeamId);
  if (teamId === null) return null;

  const name = firstDefined(rawTeam, ["name", "teamName"]) || `Team ${teamId}`;
  const logoFileName = firstDefined(rawTeam, ["logoUrl", "logo", "logoFileName"]);

  return {
    teamId,
    teamName: name,
    logoUrl: buildTeamLogoUrl(teamId, logoFileName),
    communityTag: firstDefined(rawTeam, ["communityTag"]),
    ranking: toFiniteNumberOrNull(firstDefined(rawTeam, ["ranking"])),
    tier: toFiniteNumberOrNull(firstDefined(rawTeam, ["tier"]))
  };
}

function sanitizeTournamentTeamEntry(rawEntry) {
  if (!rawEntry || typeof rawEntry !== "object") return null;

  const teamId = toFiniteNumberOrNull(firstDefined(rawEntry, ["teamId", "team.id"]));
  if (teamId === null) return null;

  const publicTeam = sanitizePublicTeam(rawEntry.team || rawEntry, teamId);

  return {
    teamId,
    position: toFiniteNumberOrNull(firstDefined(rawEntry, ["position", "rank"])),
    gamesCount: toFiniteNumberOrNull(firstDefined(rawEntry, ["gamesCount", "games"])),
    winsCount: toFiniteNumberOrNull(firstDefined(rawEntry, ["winsCount", "wins"])),
    drawsCount: toFiniteNumberOrNull(firstDefined(rawEntry, ["drawsCount", "draws"])),
    lossesCount: toFiniteNumberOrNull(firstDefined(rawEntry, ["lossesCount", "losses"])),
    points: toFiniteNumberOrNull(firstDefined(rawEntry, ["points"])),
    roundDifference: toFiniteNumberOrNull(firstDefined(rawEntry, ["roundDifference", "roundDiff"])),
    team: publicTeam
  };
}

function getTeamNameFromMatchSide(rawMatch, side) {
  return firstDefined(rawMatch, [
    `${side}Team.name`,
    `${side}.name`,
    `${side}TeamName`
  ]);
}

function isMatchLikeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const id = toFiniteNumberOrNull(value.id ?? value.matchId);
  const homeTeamId = toFiniteNumberOrNull(firstDefined(value, ["homeTeamId", "team1Id", "homeTeam.id"]));
  const awayTeamId = toFiniteNumberOrNull(firstDefined(value, ["awayTeamId", "team2Id", "awayTeam.id"]));

  return id !== null && homeTeamId !== null && awayTeamId !== null;
}

function normalizeTournamentMatch(rawMatch, context = {}) {
  const id = toFiniteNumberOrNull(rawMatch.id ?? rawMatch.matchId);
  if (id === null) return null;

  const homeTeamId = toFiniteNumberOrNull(firstDefined(rawMatch, ["homeTeamId", "team1Id", "homeTeam.id"]));
  const awayTeamId = toFiniteNumberOrNull(firstDefined(rawMatch, ["awayTeamId", "team2Id", "awayTeam.id"]));
  if (homeTeamId === null || awayTeamId === null) return null;

  const homeScore = toFiniteNumberOrNull(firstDefined(rawMatch, ["homeTeamRounds", "homeScore", "team1Rounds", "scoreHome"]));
  const awayScore = toFiniteNumberOrNull(firstDefined(rawMatch, ["awayTeamRounds", "awayScore", "team2Rounds", "scoreAway"]));
  const winnerId = toFiniteNumberOrNull(firstDefined(rawMatch, ["winnerId"]));

  return {
    id,
    stageName: firstDefined(rawMatch, ["stageName", "stage.name"]) || context.stageName || "",
    stageStatus: context.stageStatus || "",
    roundName: firstDefined(rawMatch, ["roundName", "round.name"]) || context.roundName || "",
    roundStatus: context.roundStatus || "",
    roundOrder: toFiniteNumberOrNull(firstDefined(rawMatch, ["roundOrder", "round.order"])) ?? context.roundOrder ?? null,
    status: firstDefined(rawMatch, ["status"]) || "",
    map: firstDefined(rawMatch, ["map"]) || "",
    date: firstDefined(rawMatch, ["date", "startsAt", "startDate"]) || "",
    homeTeamId,
    awayTeamId,
    homeTeamName: getTeamNameFromMatchSide(rawMatch, "home") || `Team ${homeTeamId}`,
    awayTeamName: getTeamNameFromMatchSide(rawMatch, "away") || `Team ${awayTeamId}`,
    homeScore,
    awayScore,
    winnerId: winnerId ?? deriveWinnerIdFromScore(homeTeamId, awayTeamId, homeScore, awayScore)
  };
}

function deriveWinnerIdFromScore(homeTeamId, awayTeamId, homeScore, awayScore) {
  if (homeScore === null || awayScore === null || homeScore === awayScore) return null;
  return homeScore > awayScore ? homeTeamId : awayTeamId;
}

function collectMatchesFromValue(value, context = {}, results = [], visited = new WeakSet()) {
  if (!value || typeof value !== "object" || visited.has(value)) return results;
  visited.add(value);

  if (isMatchLikeObject(value)) {
    const match = normalizeTournamentMatch(value, context);
    if (match) results.push(match);
    return results;
  }

  const nextContext = { ...context };
  if (firstDefined(value, ["name"]) && (Array.isArray(value.matches) || Array.isArray(value.rounds))) {
    nextContext.roundName = value.name;
    nextContext.roundOrder = toFiniteNumberOrNull(firstDefined(value, ["order", "position", "number"]));
    nextContext.roundStatus = firstDefined(value, ["status"]) || "";
  }

  const children = Array.isArray(value) ? value : Object.values(value);
  children.forEach(child => collectMatchesFromValue(child, nextContext, results, visited));
  return results;
}

function sanitizeTournamentStage(rawStage, index = 0) {
  const stageName = firstDefined(rawStage, ["name"]) || `Stage ${index + 1}`;
  const stageStatus = firstDefined(rawStage, ["status"]) || "";
  const matches = collectMatchesFromValue(rawStage, {
    stageName,
    stageStatus,
    roundName: "",
    roundOrder: index
  });
  const uniqueMatches = Array.from(new Map(matches.map(match => [String(match.id), match])).values());

  return {
    id: toFiniteNumberOrNull(firstDefined(rawStage, ["id"])),
    name: stageName,
    status: stageStatus,
    formatType: firstDefined(rawStage, ["formatType", "type"]) || "",
    teams: Array.isArray(rawStage?.teams) ? rawStage.teams.map(sanitizeTournamentTeamEntry).filter(Boolean) : [],
    matches: uniqueMatches
  };
}

function sanitizeTournamentData(data) {
  return {
    id: toFiniteNumberOrNull(firstDefined(data, ["id", "tournamentId"])),
    name: firstDefined(data, ["name"]) || "Tournament",
    status: firstDefined(data, ["status"]) || "",
    type: firstDefined(data, ["type"]) || "",
    season: toFiniteNumberOrNull(firstDefined(data, ["season"])),
    tier: toFiniteNumberOrNull(firstDefined(data, ["tier"])),
    winnerId: toFiniteNumberOrNull(firstDefined(data, ["winnerId"])),
    sponsor: firstDefined(data, ["sponsor"]) || "",
    format: firstDefined(data, ["format"]) || "",
    logoUrl: firstDefined(data, ["logoUrl"]) || "",
    teams: Array.isArray(data?.teams) ? data.teams.map(sanitizeTournamentTeamEntry).filter(Boolean) : [],
    stages: Array.isArray(data?.stages) ? data.stages.map(sanitizeTournamentStage).filter(Boolean) : []
  };
}

async function fetchChampionshipTournaments(season, forceRefresh = false) {
  const cacheKey = `championship:${season}`;
  const cached = !forceRefresh ? getFreshCommunityTournamentCacheEntry(cacheKey) : null;
  if (cached) return { ...cached, source: "cache" };

  const data = await fetchJsonWithRetry(buildChampionshipDataUrl(season), {
    headers: { "Accept": "application/json" }
  }, "Championship tournament list");
  const summaries = extractTournamentSummariesFromData(data, season).slice(0, COMMUNITY_TOURNAMENT_FETCH_LIMIT);
  const payload = {
    summaries,
    tournamentIds: extractTournamentIdsFromChampionshipData(data).filter(id => summaries.some(tournament => tournament.id === id))
  };
  setCommunityTournamentCacheEntry(cacheKey, payload);
  return { ...payload, source: "api" };
}

async function fetchOfficialTournaments(season, forceRefresh = false) {
  const cacheKey = `official:${season}`;
  const cached = !forceRefresh ? getFreshCommunityTournamentCacheEntry(cacheKey) : null;
  if (cached) return { ...cached, source: "cache" };

  const data = await fetchJsonWithRetry(buildOfficialTournamentsDataUrl(), {
    headers: { "Accept": "application/json" }
  }, "Official tournament list");
  const summaries = extractTournamentSummariesFromData(data, season).slice(0, COMMUNITY_TOURNAMENT_FETCH_LIMIT);
  const payload = {
    summaries,
    tournamentIds: extractTournamentIdsFromOfficialData(data, season).filter(id => summaries.some(tournament => tournament.id === id))
  };
  setCommunityTournamentCacheEntry(cacheKey, payload);
  return { ...payload, source: "api" };
}

async function fetchTournamentDetails(tournamentId, forceRefresh = false) {
  const cacheKey = `tournament:${tournamentId}`;
  const cached = !forceRefresh ? getFreshCommunityTournamentCacheEntry(cacheKey) : null;
  if (cached) return { ...cached, source: "cache" };

  const data = await fetchJsonWithRetry(buildTournamentDetailDataUrl(tournamentId), {
    headers: { "Accept": "application/json" }
  }, `Tournament ${tournamentId}`);
  const tournament = sanitizeTournamentData(data);
  const payload = { tournament };
  setCommunityTournamentCacheEntry(cacheKey, payload);
  return { ...payload, source: "api" };
}

function getCommunityTournamentTeams() {
  const teamsById = new Map();

  function addTeam(team) {
    const teamId = toFiniteNumberOrNull(team?.teamId ?? team?.id);
    if (teamId === null || teamsById.has(String(teamId))) return;

    teamsById.set(String(teamId), {
      teamId,
      teamName: team.teamName || team.name || `Team ${teamId}`,
      logoUrl: team.logoUrl || "",
      communityTag: team.communityTag || ""
    });
  }

  communityStatsState.teams.forEach(addTeam);

  const cached = getFreshCommunityStatsCache(
    communityStatsState.seasonState?.season || getCurrentCplSeasonState().season,
    communityStatsState.ladderId || getCurrentCplSeasonState().season + 36
  );
  if (cached?.communityData) {
    normalizeCommunityTeams(cached.communityData).forEach(addTeam);
  }

  COMMUNITY_DEMO_TEAMS
    .filter(team => COMMUNITY_FALLBACK_TEAM_IDS.includes(Number(team.teamId)))
    .forEach(addTeam);

  return [...teamsById.values()];
}

function tournamentHasTeam(tournament, teamId) {
  const id = String(teamId);
  if (tournament.teams.some(team => String(team.teamId) === id)) return true;

  return tournament.stages.some(stage => (
    stage.teams.some(team => String(team.teamId) === id) ||
    stage.matches.some(match => String(match.homeTeamId) === id || String(match.awayTeamId) === id)
  ));
}

function findCommunityTeamsInTournament(tournament, communityTeams) {
  return communityTeams.filter(team => tournamentHasTeam(tournament, team.teamId));
}

function getTournamentTeamEntries(tournament, teamId) {
  const id = String(teamId);
  const entries = [];

  tournament.teams.forEach(team => {
    if (String(team.teamId) === id) {
      entries.push({
        ...team,
        stageName: "",
        stageStatus: ""
      });
    }
  });

  tournament.stages.forEach(stage => {
    stage.teams.forEach(team => {
      if (String(team.teamId) === id) {
        entries.push({
          ...team,
          stageName: stage.name,
          stageStatus: stage.status
        });
      }
    });
  });

  return entries;
}

function getBestTournamentTeamEntry(tournament, teamId) {
  const entries = getTournamentTeamEntries(tournament, teamId);
  return [...entries].reverse().find(entry => entry.stageName) || entries[0] || null;
}

function extractMatchesForTeam(tournament, teamId) {
  const id = String(teamId);
  const matches = [];

  tournament.stages.forEach(stage => {
    stage.matches.forEach(match => {
      if (String(match.homeTeamId) === id || String(match.awayTeamId) === id) {
        matches.push({
          ...match,
          stageName: match.stageName || stage.name,
          stageStatus: match.stageStatus || stage.status
        });
      }
    });
  });

  return Array.from(new Map(matches.map(match => [String(match.id), match])).values())
    .sort(compareTournamentMatches);
}

function compareTournamentMatches(a, b) {
  const dateA = Date.parse(a.date || "");
  const dateB = Date.parse(b.date || "");
  if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) return dateA - dateB;
  if (Number.isFinite(dateA)) return -1;
  if (Number.isFinite(dateB)) return 1;

  const roundSort = compareNullableNumbers(a.roundOrder, b.roundOrder, "asc");
  if (roundSort !== 0) return roundSort;

  return compareNullableNumbers(a.id, b.id, "asc");
}

function getMatchBucket(match) {
  const status = normalizeSearchValue(match.status);
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const dateValue = Date.parse(match.date || "");

  if (status.includes("live") || status.includes("playing") || status.includes("progress")) return "live";
  if (status.includes("processed") || status.includes("finished") || hasScore) return "played";
  if (Number.isFinite(dateValue) && dateValue > Date.now()) return "upcoming";
  if (status.includes("pending") || status.includes("scheduled") || status.includes("queued")) return "upcoming";
  return "unknown";
}

function groupTournamentMatches(matches) {
  return {
    live: matches.filter(match => getMatchBucket(match) === "live"),
    upcoming: matches.filter(match => getMatchBucket(match) === "upcoming"),
    played: matches.filter(match => getMatchBucket(match) === "played"),
    unknown: matches.filter(match => getMatchBucket(match) === "unknown")
  };
}

function deriveTournamentStatus(team, tournament, matches) {
  const teamId = toFiniteNumberOrNull(team.teamId);
  if (teamId !== null && tournament.winnerId === teamId) return "Winner";

  const buckets = groupTournamentMatches(matches);
  if (buckets.live.length) return "Live";

  const finalPending = buckets.upcoming.some(match => getKnockoutPositionLimit(match) === 2);
  if (finalPending) return "Finalist";

  if (buckets.upcoming.length) return "Upcoming match";

  const playedMatches = [...buckets.played].sort(compareTournamentMatches);
  const lastPlayed = playedMatches.length ? playedMatches[playedMatches.length - 1] : null;
  if (lastPlayed && lastPlayed.winnerId !== null && teamId !== null && lastPlayed.winnerId !== teamId) {
    const phase = normalizeSearchValue(`${lastPlayed.stageName} ${lastPlayed.roundName}`);
    if (isKnockoutPhase(phase)) {
      return "Eliminated";
    }
  }

  if (normalizeSearchValue(tournament.status).includes("finished") && teamId !== null && tournament.winnerId !== teamId) {
    return "Eliminated";
  }

  return "Unknown";
}

function getTournamentCategory(tournament, group) {
  if (group === "championship") {
    const inferred = inferTournamentCategoryFromName(tournament.name);
    if (inferred && inferred !== "championship") return inferred;
    if (tournament.type && normalizeSearchValue(tournament.type) !== "championship") return tournament.type;
    if (inferred === "championship" || normalizeSearchValue(tournament.type) === "championship") return "legends";
    return inferred || tournament.type || "legends";
  }

  const officialName = inferOfficialTournamentCategory(tournament.name, tournament.tier);
  if (officialName) return officialName;
  return tournament.type && normalizeSearchValue(tournament.type) !== "official" ? tournament.type : "official";
}

function inferTournamentCategoryFromName(name) {
  const normalized = normalizeSearchValue(name);
  if (normalized.includes("contenders")) return "contenders";
  if (normalized.includes("challengers")) return "challengers";
  if (normalized.includes("legends")) return "legends";
  if (normalized.includes("championship")) return "championship";
  return "";
}

function inferOfficialTournamentCategory(name, tier) {
  const normalized = normalizeSearchValue(name);
  if (normalized.includes("luminous")) return "luminous";
  if (normalized.includes("cyberathletes")) return "cyberathletes";
  if (Number(tier) === 0) return "luminous";
  if (Number(tier) === 1) return "cyberathletes";
  return "";
}

function isKnockoutPhase(value) {
  const phase = normalizeSearchValue(value);
  return (
    phase.includes("playoff") ||
    phase.includes("final") ||
    phase.includes("semi") ||
    phase.includes("quarter") ||
    phase.includes("round of")
  );
}

function getRelevantTournamentMatch(matches) {
  const buckets = groupTournamentMatches(matches);
  const activeMatches = [...buckets.live, ...buckets.upcoming].sort(compareTournamentMatches);
  if (activeMatches.length) return activeMatches[0];

  const playedMatches = [...buckets.played].sort(compareTournamentMatches);
  if (playedMatches.length) return playedMatches[playedMatches.length - 1];

  const unknownMatches = [...buckets.unknown].sort(compareTournamentMatches);
  return unknownMatches[unknownMatches.length - 1] || null;
}

function getKnockoutPositionLimit(match) {
  if (!match || !isKnockoutPhase(`${match.stageName} ${match.roundName}`)) return null;

  const phase = normalizeSearchValue(match.roundName || match.stageName);
  if (phase.includes("semi")) return 4;
  if (phase.includes("quarter")) return 8;

  const roundMatch = phase.match(/round of\s+(\d+)/);
  if (roundMatch) return Number(roundMatch[1]);

  if (phase.includes("grand final") || phase === "final" || phase === "finals" || phase.endsWith(" final")) return 2;

  return null;
}

function deriveTournamentPositionLabel(team, tournament, matches, teamEntry, statusText, group) {
  const teamId = toFiniteNumberOrNull(team.teamId);
  const position = toFiniteNumberOrNull(teamEntry?.position);

  if (teamId !== null && tournament.winnerId === teamId) return "#1";

  const relevantMatch = getRelevantTournamentMatch(matches);
  const knockoutLimit = getKnockoutPositionLimit(relevantMatch);
  if (knockoutLimit !== null) {
    const buckets = groupTournamentMatches(matches);
    const playedMatches = [...buckets.played].sort(compareTournamentMatches);
    const lastPlayed = playedMatches[playedMatches.length - 1] || null;
    const lostRelevantMatch = lastPlayed &&
      relevantMatch &&
      String(lastPlayed.id) === String(relevantMatch.id) &&
      lastPlayed.winnerId !== null &&
      teamId !== null &&
      lastPlayed.winnerId !== teamId;

    if (knockoutLimit === 2 && lostRelevantMatch) return "#2";
    return `Top ${knockoutLimit}`;
  }

  if (normalizeSearchValue(statusText).includes("winner")) return "#1";
  if (normalizeSearchValue(statusText).includes("eliminated")) {
    if (group === "eos" && position !== null) return `#${formatCommunityNumber(position)}`;
    return ">16";
  }

  return position === null ? "-" : `#${formatCommunityNumber(position)}`;
}

function deriveTournamentStageLabel(teamEntry, matches) {
  const relevantMatch = getRelevantTournamentMatch(matches);
  if (relevantMatch && isKnockoutPhase(`${relevantMatch.stageName} ${relevantMatch.roundName}`)) {
    return formatTournamentLabel(relevantMatch.roundName || relevantMatch.stageName);
  }

  return teamEntry?.stageName || relevantMatch?.stageName || "-";
}

function deriveTournamentStatusWithEntry(team, tournament, matches, teamEntry) {
  const status = deriveTournamentStatus(team, tournament, matches);
  if (status !== "Unknown") return status;

  const hasLaterMatchThanEntry = teamEntry?.stageName
    ? matches.some(match => match.stageName && match.stageName !== teamEntry.stageName)
    : false;
  const position = toFiniteNumberOrNull(teamEntry?.position);

  if (
    teamEntry?.stageName &&
    !hasLaterMatchThanEntry &&
    normalizeSearchValue(teamEntry.stageStatus).includes("finished")
  ) {
    if (position !== null && position > 1) return "Eliminated";
    return "Finished";
  }

  return status;
}

function formatTournamentRecord(entry) {
  if (!entry) return "-";
  const wins = toFiniteNumberOrNull(entry.winsCount);
  const draws = toFiniteNumberOrNull(entry.drawsCount);
  const losses = toFiniteNumberOrNull(entry.lossesCount);

  if (wins !== null || draws !== null || losses !== null) {
    return `${wins ?? 0}-${draws ?? 0}-${losses ?? 0}`;
  }

  return "-";
}

function buildTournamentItems(tournaments, communityTeams, group, summaries = []) {
  const summaryById = new Map(summaries.map(summary => [String(summary.id), summary]));
  const items = [];

  tournaments.forEach(tournament => {
    const summary = summaryById.get(String(tournament.id)) || {};
    const matchingTeams = findCommunityTeamsInTournament(tournament, communityTeams);

    matchingTeams.forEach(team => {
      const teamEntry = getBestTournamentTeamEntry(tournament, team.teamId);
      const teamIdentityEntry = getTournamentTeamEntries(tournament, team.teamId)
        .find(entry => entry.team?.teamName && entry.team.teamName !== `Team ${team.teamId}`);
      const matches = extractMatchesForTeam(tournament, team.teamId);
      const tier = tournament.tier ?? summary.tier ?? null;
      const tournamentCategory = getTournamentCategory({ ...summary, ...tournament, tier }, group);
      const derivedStatus = deriveTournamentStatusWithEntry(team, tournament, matches, teamEntry);
      const stageName = deriveTournamentStageLabel(teamEntry, matches);
      const positionLabel = deriveTournamentPositionLabel(team, tournament, matches, teamEntry, derivedStatus, group);

      items.push({
        group,
        team: {
          ...team,
          teamName: teamIdentityEntry?.team?.teamName || team.teamName,
          logoUrl: teamIdentityEntry?.team?.logoUrl || team.logoUrl
        },
        tournament: {
          id: tournament.id,
          name: tournament.name || summary.name || "Tournament",
          status: tournament.status || summary.status || "",
          type: tournamentCategory,
          tier,
          winnerId: tournament.winnerId
        },
        stageName,
        stageStatus: teamEntry?.stageStatus || matches.find(match => match.stageStatus)?.stageStatus || "",
        position: teamEntry?.position ?? null,
        positionLabel,
        record: formatTournamentRecord(teamEntry),
        derivedStatus,
        matches,
        matchBuckets: groupTournamentMatches(matches)
      });
    });
  });

  return items;
}



function buildTeamLogoUrl(teamId, logoFileName) {
  const cleanLogo = String(logoFileName ?? "").trim();
  if (!cleanLogo || !teamId) return "";
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(cleanLogo)) return cleanLogo;

  return `${CPL_MEDIA_TEAM_BASE}/${encodeURIComponent(teamId)}/${encodeURIComponent(cleanLogo)}`;
}

function escapeSvgText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildInlineSvgDataUrl(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildDemoLogoDataUrl(label, color = "#ff7a00") {
  const cleanLabel = String(label || "Team").trim();
  const initials = cleanLabel
    .split(/\s+/)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "T";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="${escapeSvgText(color)}"/>
      <circle cx="48" cy="16" r="16" fill="#ffffff" opacity="0.18"/>
      <text x="32" y="39" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">${escapeSvgText(initials)}</text>
    </svg>
  `;

  return buildInlineSvgDataUrl(svg);
}

function buildDemoDivisionIconDataUrl(divisionName) {
  const label = String(divisionName || "?").slice(0, 1).toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <path d="M24 3 43 13v14c0 10-8 16-19 18C13 43 5 37 5 27V13L24 3Z" fill="#2f67d8"/>
      <path d="M24 8 37 15v11c0 7-5 11-13 13-8-2-13-6-13-13V15l13-7Z" fill="#5f92ff"/>
      <text x="24" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#ffffff">${escapeSvgText(label)}</text>
    </svg>
  `;

  return buildInlineSvgDataUrl(svg);
}

function buildCplTeamUrl(teamId) {
  return teamId ? `https://www.cplmanager.com/cpl/teams/${encodeURIComponent(teamId)}` : "";
}

function buildCplPlayerUrl(teamId, playerId) {
  return teamId && playerId
    ? `${buildCplTeamUrl(teamId)}/players/${encodeURIComponent(playerId)}`
    : "";
}

function getDivisionName(division) {
  const numericDivision = toFiniteNumberOrNull(division);
  if (numericDivision === null) return "";
  return DIVISION_MAP[numericDivision] || "";
}

function buildDivisionIconUrl(divisionName) {
  return divisionName ? `https://www.cplmanager.com/logos/divisions/${encodeURIComponent(divisionName)}.png` : "";
}

function normalizeCommunityTeam(rawTeam, communityData = {}) {
  const directTeamId = firstDefined(rawTeam, ["teamId", "team.id"]);
  const fallbackId = firstDefined(rawTeam, ["id"]);
  const teamId = directTeamId ?? fallbackId;
  if (teamId === null) return null;

  const division = toFiniteNumberOrNull(firstDefined(rawTeam, ["division", "team.division"]));
  const divisionName = getDivisionName(division);
  const teamName = firstDefined(rawTeam, ["teamName", "name", "team.name"]) || `Team ${teamId}`;
  const logoFileName = firstDefined(rawTeam, ["logoUrl", "logo", "logoFileName", "team.logoUrl", "team.logo"]);
  const divisionIconUrl = firstDefined(rawTeam, ["divisionIconUrl", "team.divisionIconUrl"]);
  const communityTag = firstDefined(rawTeam, [
    "communityTag",
    "team.communityTag",
    "community.tag"
  ]) || firstDefined(communityData, ["community.tag", "tag"]);
  const username = firstDefined(rawTeam, [
    "username",
    "manager",
    "managerName",
    "user.username",
    "team.user.username"
  ]);
  const fame = toFiniteNumberOrNull(firstDefined(rawTeam, ["fame", "famePoints", "team.fame", "team.famePoints"]));

  return {
    teamId: toFiniteNumberOrNull(teamId) ?? String(teamId),
    teamName,
    username,
    ranking: toFiniteNumberOrNull(firstDefined(rawTeam, ["ranking", "team.ranking"])),
    leaguePosition: toFiniteNumberOrNull(firstDefined(rawTeam, ["leaguePosition", "team.leaguePosition"])),
    division,
    divisionName,
    divisionIconUrl: divisionIconUrl || buildDivisionIconUrl(divisionName),
    fame,
    famePoints: fame,
    logoUrl: buildTeamLogoUrl(teamId, logoFileName),
    country: firstDefined(rawTeam, ["country", "team.country", "user.country"]),
    communityTag,
    ladderPosition: null,
    ladderPoints: null,
    ladderWins: null,
    ladderLosses: null,
    ladderStreak: null
  };
}

function normalizeCommunityTeams(rawData) {
  const teams = getCommunityTeamArray(rawData)
    .map(team => normalizeCommunityTeam(team, rawData))
    .filter(Boolean);
  const seen = new Set();

  return teams.filter(team => {
    const key = String(team.teamId);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getCommunityDisplayName(rawData) {
  return firstDefined(rawData, [
    "name",
    "title",
    "communityName",
    "community.name",
    "community.title"
  ]) || `Community ${COMMUNITY_ID}`;
}

function normalizeLadderEntry(rawEntry) {
  const teamId = firstDefined(rawEntry, ["teamId", "team.id"]);
  if (teamId === null) return null;

  return {
    teamId: toFiniteNumberOrNull(teamId) ?? String(teamId),
    ladderPosition: toFiniteNumberOrNull(firstDefined(rawEntry, ["position", "ladderPosition", "rank"])),
    ladderPoints: toFiniteNumberOrNull(firstDefined(rawEntry, ["points", "ladderPoints"])),
    ladderWins: toFiniteNumberOrNull(firstDefined(rawEntry, ["wins", "ladderWins"])),
    ladderLosses: toFiniteNumberOrNull(firstDefined(rawEntry, ["losses", "ladderLosses"])),
    ladderStreak: toFiniteNumberOrNull(firstDefined(rawEntry, ["streak", "ladderStreak"]))
  };
}

function normalizeLadderEntries(rawData) {
  const entries = getLadderEntryArray(rawData)
    .map(normalizeLadderEntry)
    .filter(Boolean);
  const seen = new Set();

  return entries.filter(entry => {
    const key = String(entry.teamId);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function joinCommunityTeamsWithLadder(teams, ladderEntries) {
  const ladderByTeamId = new Map(ladderEntries.map(entry => [String(entry.teamId), entry]));

  return teams.map(team => ({
    ...team,
    ...(ladderByTeamId.get(String(team.teamId)) || {})
  }));
}

function getRankingPlayerTeamId(player) {
  return firstDefined(player, ["teamId", "team.id", "teamID"]);
}

function getRankingPlayerStat(player, paths) {
  return firstDefined(player, paths);
}

function normalizeCommunityRankingPlayer(rawPlayer, teamById, fallbackRank = null) {
  const teamId = getRankingPlayerTeamId(rawPlayer);
  const team = teamById.get(String(teamId));
  if (!team) return null;

  const playerId = firstDefined(rawPlayer, ["id", "playerId", "player.id"]);
  const playerStats = Array.isArray(rawPlayer.playerStats) ? rawPlayer.playerStats : null;
  const kills = toFiniteNumberOrNull(getRankingPlayerStat(rawPlayer, [
    "kills",
    "stat.kills",
    "stat.totalKills",
    "totalKills",
    "playerStats.totalKills"
  ]));
  const deaths = toFiniteNumberOrNull(getRankingPlayerStat(rawPlayer, [
    "deaths",
    "stat.deaths",
    "stat.totalDeaths",
    "totalDeaths",
    "playerStats.totalDeaths"
  ]));
  const headshots = toFiniteNumberOrNull(getRankingPlayerStat(rawPlayer, [
    "headshots",
    "stat.headshots",
    "stat.totalHeadshots",
    "totalHeadshots",
    "playerStats.totalHeadshots"
  ]));
  const directKd = getRankingPlayerStat(rawPlayer, ["kdRatio", "stat.kdRatio"]);
  const directHs = getRankingPlayerStat(rawPlayer, ["hsPercentage", "stat.hsPercentage"]);
  const computedKd = deaths && kills !== null ? kills / deaths : null;
  const computedHs = kills && headshots !== null ? (headshots / kills) * 100 : null;

  return {
    playerId,
    name: firstDefined(rawPlayer, ["name", "player.name"]) || "Unknown Player",
    nick: firstDefined(rawPlayer, ["nick", "nickname", "player.nick"]),
    teamId: team.teamId,
    teamName: team.teamName || firstDefined(rawPlayer, ["team.name"]),
    teamLogoUrl: team.logoUrl || "",
    country: firstDefined(rawPlayer, ["country", "player.country"]),
    rank: toFiniteNumberOrNull(firstDefined(rawPlayer, ["rank", "ranking", "position"])) ?? fallbackRank,
    games: toFiniteNumberOrNull(getRankingPlayerStat(rawPlayer, [
      "games",
      "stat.games",
      "stat.matches",
      "matches",
      "totalGames"
    ])) ?? (playerStats ? playerStats.length : null),
    kills,
    deaths,
    headshots,
    mvps: toFiniteNumberOrNull(getRankingPlayerStat(rawPlayer, [
      "mvps",
      "stat.mvps",
      "stat.totalMvps",
      "totalMvps"
    ])),
    kdRatio: directKd ?? computedKd,
    hsPercentage: directHs ?? computedHs
  };
}

function normalizeCommunityRankingPlayers(rankingPlayers, teams) {
  const teamById = new Map(teams.map(team => [String(team.teamId), team]));

  const players = rankingPlayers
    .map((player, index) => normalizeCommunityRankingPlayer(player, teamById, index + 1))
    .filter(Boolean);

  return players
    .sort((a, b) => {
      const rankA = toFiniteNumberOrNull(a.rank);
      const rankB = toFiniteNumberOrNull(b.rank);

      if (rankA !== null && rankB !== null && rankA !== rankB) return rankA - rankB;
      if (rankA !== null && rankB === null) return -1;
      if (rankA === null && rankB !== null) return 1;

      const kdA = toFiniteNumberOrNull(a.kdRatio);
      const kdB = toFiniteNumberOrNull(b.kdRatio);
      if (kdA !== null && kdB !== null && kdA !== kdB) return kdB - kdA;

      return String(a.nick || a.name || "").localeCompare(String(b.nick || b.name || ""));
    })
    .map((player, index) => ({
      ...player,
      communityRank: index + 1
    }));
}

function syncCommunityPlayersWithTeams(players, teams) {
  const teamById = new Map(teams.map(team => [String(team.teamId), team]));

  return players.map(player => {
    const team = teamById.get(String(player.teamId));
    if (!team) return player;

    return {
      ...player,
      teamName: team.teamName || player.teamName,
      teamLogoUrl: team.logoUrl || player.teamLogoUrl
    };
  });
}

function formatCommunityNumber(value) {
  const number = toFiniteNumberOrNull(value);
  return number === null ? "-" : new Intl.NumberFormat("en-US").format(number);
}

function formatCommunityDecimal(value, digits = 2) {
  const number = toFiniteNumberOrNull(value);
  return number === null ? "-" : number.toFixed(digits);
}

function formatCommunityPercentage(value) {
  const number = toFiniteNumberOrNull(value);
  if (number === null) return "-";
  const normalized = number <= 1 ? number * 100 : number;
  return `${normalized.toFixed(1)}%`;
}

function getCountryCode(countryName) {
  const clean = normalizeSearchValue(countryName);
  if (!clean) return "";
  if (/^[a-z]{2}$/i.test(clean)) return clean.toUpperCase();

  return COUNTRY_CODE_MAP[clean] || "";
}

function getFlagEmoji(countryName) {
  const code = getCountryCode(countryName);
  if (!code) return "";

  return Array.from(code.toUpperCase())
    .map(char => 127397 + char.charCodeAt(0))
    .map(codePoint => String.fromCodePoint(codePoint))
    .join("");
}

function renderCountryFlag(countryName) {
  const flag = getFlagEmoji(countryName);
  const label = countryName || "-";

  return flag
    ? `<span class="community-country-flag" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${flag}</span>`
    : escapeHtml(label);
}

function renderCommunityRankingTrend(team) {
  const delta = toFiniteNumberOrNull(team.rankingDelta);
  if (delta === null || !team.rankingBaselineSeason) return "";

  const trendClass = team.rankingTrend === "up"
    ? "up"
    : team.rankingTrend === "down"
      ? "down"
      : "same";
  const symbol = team.rankingTrend === "up"
    ? "\u25B2"
    : team.rankingTrend === "down"
      ? "\u25BC"
      : "\u2192";
  const amount = Math.abs(delta);
  const amountText = amount > 0 ? String(amount) : "0";
  const title = `${team.rankingTrend === "up" ? "Improved" : team.rankingTrend === "down" ? "Worse" : "Unchanged"} vs S${team.rankingBaselineSeason} end ranking #${team.previousRanking}`;

  return `<span class="community-ranking-trend ${trendClass}" title="${escapeHtml(title)}">${symbol} ${escapeHtml(amountText)}</span>`;
}

function compareNullableNumbers(a, b, direction = "asc") {
  const aNumber = toFiniteNumberOrNull(a);
  const bNumber = toFiniteNumberOrNull(b);

  if (aNumber === null && bNumber === null) return 0;
  if (aNumber === null) return 1;
  if (bNumber === null) return -1;

  return direction === "asc" ? aNumber - bNumber : bNumber - aNumber;
}

function getFilteredCommunityTeams() {
  const { key, direction } = communityStatsState.teamSort;

  return [...communityStatsState.teams]
    .sort((a, b) => {
      const numericSort = compareNullableNumbers(a[key], b[key], direction);
      if (numericSort !== 0) return numericSort;

      return String(a.teamName || "").localeCompare(String(b.teamName || ""));
    });
}

function getFilteredCommunityPlayers() {
  const search = normalizeSearchValue(communityStatsState.playerSearch);
  const selectedTeamId = String(communityStatsState.playerTeamId || "");
  const { key, direction } = communityStatsState.playerSort;

  return [...communityStatsState.players]
    .filter(player => {
      const matchesTeam = !selectedTeamId || String(player.teamId) === selectedTeamId;
      const searchableNick = player.nick || player.name;
      const matchesSearch = !search || normalizeSearchValue(searchableNick).includes(search);

      return matchesTeam && matchesSearch;
    })
    .sort((a, b) => {
      const primarySort = compareNullableNumbers(a[key], b[key], direction);
      if (primarySort !== 0) return primarySort;

      const rankSort = compareNullableNumbers(a.rank, b.rank, "asc");
      if (rankSort !== 0) return rankSort;

      return String(a.nick || a.name || "").localeCompare(String(b.nick || b.name || ""));
    });
}

function renderCommunityTeamSortButtons() {
  document.querySelectorAll("[data-community-team-sort]").forEach(button => {
    const key = button.dataset.communityTeamSort;
    const active = communityStatsState.teamSort.key === key;
    const baseText = button.dataset.sortLabel || button.textContent.replace(/\s+\((asc|desc)\)$/i, "");
    button.dataset.sortLabel = baseText;

    button.classList.toggle("active", active);
    button.textContent = `${baseText}${active ? ` (${communityStatsState.teamSort.direction})` : ""}`;
  });
}

function renderCommunityPlayerSortButtons() {
  document.querySelectorAll("[data-community-player-sort]").forEach(button => {
    const key = button.dataset.communityPlayerSort;
    const active = communityStatsState.playerSort.key === key;
    const baseText = button.dataset.sortLabel || button.textContent.replace(/\s+\((asc|desc)\)$/i, "");
    button.dataset.sortLabel = baseText;

    button.classList.toggle("active", active);
    button.textContent = `${baseText}${active ? ` (${communityStatsState.playerSort.direction})` : ""}`;
  });
}

function getDefaultCommunityPlayerSortDirection(key) {
  return key === "rank" || key === "deaths" ? "asc" : "desc";
}

function renderCommunityTeamFilter() {
  const select = document.getElementById("community-player-team-filter");
  if (!select) return;

  const currentValue = communityStatsState.playerTeamId || "";
  const teams = [...communityStatsState.teams].sort((a, b) => String(a.teamName || "").localeCompare(String(b.teamName || "")));

  select.innerHTML = `
    <option value="">All teams</option>
    ${teams.map(team => `<option value="${escapeHtml(team.teamId)}">${escapeHtml(team.teamName)}</option>`).join("")}
  `;

  select.value = teams.some(team => String(team.teamId) === String(currentValue)) ? String(currentValue) : "";
  communityStatsState.playerTeamId = select.value;
}

function renderCommunityTeamsTable() {
  const body = document.getElementById("community-teams-body");
  if (!body) return;

  const teams = getFilteredCommunityTeams();

  if (!teams.length) {
    body.innerHTML = `<tr><td colspan="7">${communityStatsState.loaded ? "No community teams available." : "No community data loaded yet."}</td></tr>`;
    return;
  }

  body.innerHTML = teams.map(team => {
    const logoHtml = team.logoUrl
      ? `<img class="community-logo" src="${escapeHtml(team.logoUrl)}" alt="${escapeHtml(team.teamName)} logo" loading="lazy">`
      : '<span class="community-empty-logo">-</span>';
    const divisionName = team.divisionName || "Unknown";
    const divisionHtml = team.divisionIconUrl
      ? `<span class="community-division" title="${escapeHtml(divisionName)}"><img src="${escapeHtml(team.divisionIconUrl)}" alt="${escapeHtml(divisionName)}" loading="lazy"></span>`
      : `<span class="community-division">${escapeHtml(divisionName)}</span>`;
    const teamUrl = buildCplTeamUrl(team.teamId);
    const teamNameHtml = teamUrl
      ? `<a class="community-link" href="${escapeHtml(teamUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(team.teamName)}</a>`
      : escapeHtml(team.teamName);
    const leagueHtml = `
      <span class="community-league">
        ${divisionHtml}
        <span>${team.leaguePosition === null ? "-" : `#${formatCommunityNumber(team.leaguePosition)}`}</span>
      </span>
    `;

    return `
      <tr>
        <td><span class="community-ranking-cell"><strong>${formatCommunityNumber(team.ranking)}</strong>${renderCommunityRankingTrend(team)}</span></td>
        <td>${logoHtml}</td>
        <td><strong>${teamNameHtml}</strong></td>
        <td>${escapeHtml(team.username || "-")}</td>
        <td>${team.ladderPosition === null ? "-" : `#${formatCommunityNumber(team.ladderPosition)}`}</td>
        <td>${leagueHtml}</td>
        <td>${formatCommunityNumber(team.fame)}</td>
      </tr>
    `;
  }).join("");
}

function renderCommunityPlayersTable() {
  const body = document.getElementById("community-players-body");
  if (!body) return;

  const players = getFilteredCommunityPlayers();

  if (!players.length) {
    body.innerHTML = `<tr><td colspan="10">${communityStatsState.loaded ? "No community players match the current filters." : "No ranking data loaded yet."}</td></tr>`;
    return;
  }

  body.innerHTML = players.map((player, index) => {
    const teamUrl = buildCplTeamUrl(player.teamId);
    const playerUrl = buildCplPlayerUrl(player.teamId, player.playerId);
    const nickLabel = player.nick || player.name || "-";
    const nickHtml = playerUrl
      ? `<a class="community-link" href="${escapeHtml(playerUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(nickLabel)}</a>`
      : escapeHtml(nickLabel);
    const teamName = player.teamName || "Team";
    const logoHtml = player.teamLogoUrl
      ? `<img class="community-logo community-player-team-logo" src="${escapeHtml(player.teamLogoUrl)}" alt="${escapeHtml(teamName)} logo" title="${escapeHtml(teamName)}" loading="lazy">`
      : `<span class="community-empty-logo community-player-team-logo" title="${escapeHtml(teamName)}">-</span>`;
    const teamLogoHtml = teamUrl
      ? `<a class="community-logo-link" href="${escapeHtml(teamUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(teamName)}">${logoHtml}</a>`
      : logoHtml;

    return `
      <tr>
        <td>${formatCommunityNumber(index + 1)}</td>
        <td>${player.rank === null ? "-" : `#${formatCommunityNumber(player.rank)}`}</td>
        <td>${teamLogoHtml}</td>
        <td><strong>${nickHtml}</strong></td>
        <td>${formatCommunityNumber(player.games)}</td>
        <td>${formatCommunityDecimal(player.kdRatio)}</td>
        <td>${formatCommunityPercentage(player.hsPercentage)}</td>
        <td>${formatCommunityNumber(player.kills)}</td>
        <td>${formatCommunityNumber(player.deaths)}</td>
        <td>${formatCommunityNumber(player.mvps)}</td>
      </tr>
    `;
  }).join("");
}

function formatTournamentLabel(value) {
  const text = String(value || "").trim();
  if (!text) return "-";
  return text
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTournamentDateTime(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getAllTournamentItems() {
  return [
    ...communityTournamentState.championshipItems,
    ...communityTournamentState.eosItems
  ];
}

function getFilteredTournamentItems(group) {
  const selectedTeamId = String(communityTournamentState.teamId || "");
  const sourceItems = group === "championship"
    ? communityTournamentState.championshipItems
    : communityTournamentState.eosItems;

  return sourceItems.filter(item => {
    return !selectedTeamId || String(item.team.teamId) === selectedTeamId;
  });
}

function renderCommunityTournamentTeamFilter() {
  const select = document.getElementById("community-tournament-team-filter");
  if (!select) return;

  const teams = getAllTournamentItems()
    .map(item => item.team)
    .filter(Boolean);
  const uniqueTeams = Array.from(new Map(teams.map(team => [String(team.teamId), team])).values())
    .sort((a, b) => String(a.teamName || "").localeCompare(String(b.teamName || "")));
  const currentValue = communityTournamentState.teamId || "";

  select.innerHTML = `
    <option value="">All teams</option>
    ${uniqueTeams.map(team => `<option value="${escapeHtml(team.teamId)}">${escapeHtml(team.teamName)}</option>`).join("")}
  `;

  select.value = uniqueTeams.some(team => String(team.teamId) === String(currentValue)) ? String(currentValue) : "";
  communityTournamentState.teamId = select.value;
}

function getActiveTournamentGroup() {
  return communityTournamentState.view === "eos" ? "eos" : "championship";
}

function getActiveTournamentItems() {
  return getFilteredTournamentItems(getActiveTournamentGroup());
}

function getTournamentGroupLabel(group = getActiveTournamentGroup()) {
  return group === "eos" ? "End of Season" : "Championship";
}

function formatEosTierLabel(tier) {
  const tierNumber = toFiniteNumberOrNull(tier);
  const tierLabels = {
    0: "S-Tier",
    1: "A-Tier",
    2: "B-Tier",
    3: "C-Tier"
  };

  return tierNumber === null ? "" : tierLabels[tierNumber] || `Tier ${tierNumber}`;
}

function formatTournamentMapName(mapName) {
  const text = String(mapName || "").trim();
  if (!text) return "-";
  return text.replace(/_v\d+$/i, "");
}

function getTournamentDisplayName(item) {
  const parts = [];
  const type = normalizeSearchValue(item.tournament.type);

  if (item.tournament.type && type !== "official") parts.push(formatTournamentLabel(item.tournament.type));
  if (item.group === "eos" && item.tournament.tier !== null && item.tournament.tier !== undefined) {
    parts.push(formatEosTierLabel(item.tournament.tier));
  }

  return parts.length ? parts.join(" / ") : item.tournament.name;
}

function getOpponentForMatch(match, teamId) {
  const id = String(teamId);
  if (String(match.homeTeamId) === id) {
    return {
      teamId: match.awayTeamId,
      teamName: match.awayTeamName || `Team ${match.awayTeamId}`
    };
  }

  return {
    teamId: match.homeTeamId,
    teamName: match.homeTeamName || `Team ${match.homeTeamId}`
  };
}

function getNextTournamentMatch(item) {
  const candidates = [
    ...item.matchBuckets.live,
    ...item.matchBuckets.upcoming,
    ...item.matchBuckets.unknown.filter(match => match.homeScore === null && match.awayScore === null)
  ];

  return candidates.sort(compareTournamentMatches)[0] || null;
}

function renderTeamLogoCell(team) {
  const teamName = team.teamName || `Team ${team.teamId}`;
  return team.logoUrl
    ? `<img class="community-logo community-player-team-logo" src="${escapeHtml(team.logoUrl)}" alt="${escapeHtml(teamName)} logo" loading="lazy">`
    : '<span class="community-empty-logo community-player-team-logo">-</span>';
}

function renderTournamentNextMatch(item) {
  const match = getNextTournamentMatch(item);
  if (!match) return "-";

  const opponent = getOpponentForMatch(match, item.team.teamId);
  const matchUrl = buildCplMatchUrl(match.id);
  const dateText = formatTournamentDateTime(match.date);
  const mapText = formatTournamentMapName(match.map);
  const metaText = match.map && dateText !== "-"
    ? `${dateText} · ${mapText}`
    : (match.map ? mapText : dateText);
  const opponentText = `vs ${opponent.teamName}`;
  const opponentHtml = matchUrl
    ? `<a class="community-link" href="${escapeHtml(matchUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(opponentText)}</a>`
    : escapeHtml(opponentText);

  return `<span class="community-next-match"><span>${escapeHtml(metaText)}</span>${opponentHtml}</span>`;
}

function getMatchOutcomeForTeam(match, teamId) {
  if (match.homeScore === null || match.awayScore === null) return "";
  if (match.homeScore === match.awayScore) return "draw";

  const id = String(teamId);
  const teamIsHome = String(match.homeTeamId) === id;
  const teamScore = teamIsHome ? match.homeScore : match.awayScore;
  const opponentScore = teamIsHome ? match.awayScore : match.homeScore;

  return teamScore > opponentScore ? "win" : "loss";
}

function renderTournamentTeamRow(item) {
  const teamUrl = buildCplTeamUrl(item.team.teamId);
  const teamNameHtml = teamUrl
    ? `<a class="community-link" href="${escapeHtml(teamUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.team.teamName)}</a>`
    : escapeHtml(item.team.teamName);
  const position = item.positionLabel || (item.position === null || item.position === undefined ? "-" : `#${formatCommunityNumber(item.position)}`);
  const stageText = item.stageName || "-";
  const statusText = item.derivedStatus && item.derivedStatus !== "Unknown"
    ? item.derivedStatus
    : formatTournamentLabel(item.stageStatus || item.tournament.status) || "-";
  const rowClass = normalizeSearchValue(statusText).includes("eliminated")
    ? ' class="community-tournament-row-eliminated"'
    : "";

  return `
    <tr${rowClass}>
      <td>${escapeHtml(position)}</td>
      <td>${renderTeamLogoCell(item.team)}</td>
      <td><strong>${teamNameHtml}</strong></td>
      <td>${escapeHtml(getTournamentDisplayName(item))}</td>
      <td>${escapeHtml(stageText)}</td>
      <td>${escapeHtml(statusText)}</td>
      <td>${escapeHtml(item.record)}</td>
      <td>${renderTournamentNextMatch(item)}</td>
    </tr>
  `;
}

function getPlayedTournamentMatchRows(items) {
  const seen = new Set();
  const rows = [];

  items.forEach(item => {
    item.matchBuckets.played.forEach(match => {
      const key = String(match.id);
      if (seen.has(key)) return;
      seen.add(key);

      rows.push({
        item,
        match,
        opponent: getOpponentForMatch(match, item.team.teamId)
      });
    });
  });

  return rows.sort((a, b) => -compareTournamentMatches(a.match, b.match));
}

function renderPlayedTournamentMatchRow(row) {
  const { item, match, opponent } = row;
  const matchUrl = buildCplMatchUrl(match.id);
  const outcome = getMatchOutcomeForTeam(match, item.team.teamId);
  const rowClass = outcome ? ` class="community-match-outcome-${outcome}"` : "";
  const scoreHtml = match.homeScore !== null && match.awayScore !== null
    ? `<span class="community-score"><span>${formatCommunityNumber(match.homeScore)}</span><span>:</span><span>${formatCommunityNumber(match.awayScore)}</span></span>`
    : "-";
  const opponentText = `vs ${opponent.teamName}`;
  const opponentHtml = matchUrl
    ? `<a class="community-link" href="${escapeHtml(matchUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(opponentText)}</a>`
    : escapeHtml(opponentText);
  const teamUrl = buildCplTeamUrl(item.team.teamId);
  const teamHtml = teamUrl
    ? `<a class="community-link" href="${escapeHtml(teamUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.team.teamName)}</a>`
    : escapeHtml(item.team.teamName);

  return `
    <tr${rowClass}>
      <td>${escapeHtml(formatTournamentDateTime(match.date))}</td>
      <td><strong>${teamHtml}</strong></td>
      <td>${opponentHtml}</td>
      <td>${scoreHtml}</td>
      <td>${escapeHtml(getTournamentDisplayName(item))}</td>
      <td>${escapeHtml(match.stageName || match.roundName || "-")}</td>
      <td>${escapeHtml(formatTournamentMapName(match.map))}</td>
    </tr>
  `;
}

function renderTournamentTables() {
  const teamBody = document.getElementById("community-tournament-teams-body");
  const matchesBody = document.getElementById("community-tournament-matches-body");
  const heading = document.getElementById("community-tournament-heading");
  const group = getActiveTournamentGroup();
  const items = getActiveTournamentItems();

  if (heading) {
    heading.textContent = getTournamentGroupLabel(group);
  }

  if (teamBody) {
    teamBody.innerHTML = items.length
      ? items.map(renderTournamentTeamRow).join("")
      : `<tr><td colspan="8">${communityTournamentState.loaded ? `No community ${getTournamentGroupLabel(group)} entries match the current filters.` : "No tournament data loaded yet."}</td></tr>`;
  }

  if (matchesBody) {
    const playedRows = getPlayedTournamentMatchRows(items);
    matchesBody.innerHTML = playedRows.length
      ? playedRows.map(renderPlayedTournamentMatchRow).join("")
      : `<tr><td colspan="7">${communityTournamentState.loaded ? "No played matches for the current tournament view." : "No played matches loaded yet."}</td></tr>`;
  }
}

function renderCommunityTournamentStatus() {
  const status = document.getElementById("community-tournament-status");
  const refreshButton = document.getElementById("community-tournament-refresh-button");

  if (refreshButton) {
    refreshButton.disabled = communityTournamentState.loading;
    refreshButton.textContent = communityTournamentState.loading ? "Loading..." : "Refresh Tournament Data";
  }

  document.querySelectorAll("[data-community-tournament-view]").forEach(button => {
    const active = button.dataset.communityTournamentView === communityTournamentState.view;
    button.classList.toggle("active", active);
  });

  if (!status) return;

  if (communityTournamentState.loading) {
    status.className = "community-status community-status-loading";
    status.textContent = communityTournamentState.warning || "Loading tournament data...";
    return;
  }

  if (communityTournamentState.error) {
    status.className = "community-status community-status-error";
    status.textContent = communityTournamentState.error;
    return;
  }

  if (communityTournamentState.warning) {
    status.className = "community-status community-status-warning";
    status.textContent = communityTournamentState.warning;
    return;
  }

  if (communityTournamentState.loaded) {
    const group = getActiveTournamentGroup();
    const itemCount = getFilteredTournamentItems(group).length;
    status.className = "community-status community-status-success";
    status.textContent = `Showing ${itemCount} ${getTournamentGroupLabel(group)} community entries. Source: ${communityTournamentState.source || "-"}.`;
    return;
  }

  status.className = "community-status";
  status.textContent = "Tournament data not loaded yet.";
}

function renderCommunityTournaments() {
  renderCommunityTournamentStatus();
  renderCommunityTournamentTeamFilter();
  renderTournamentTables();
}

function getCommunityExportDateStamp(date = new Date()) {
  const parts = getBerlinDateTimeParts(date);
  return [
    parts.year,
    String(parts.month).padStart(2, "0"),
    String(parts.day).padStart(2, "0")
  ].join("-");
}

function renderCommunityStatus() {
  const status = document.getElementById("community-stats-status");
  const communityHeading = document.getElementById("community-name-heading");
  const seasonLabel = document.getElementById("community-season-label");
  const refreshButton = document.getElementById("community-refresh-button");
  const seasonState = communityStatsState.seasonState || getCurrentCplSeasonState();
  const ladderId = communityStatsState.ladderId || seasonState.season + 36;

  if (communityHeading) {
    communityHeading.textContent = communityStatsState.communityName || `Community ${COMMUNITY_ID}`;
  }

  if (seasonLabel) {
    seasonLabel.textContent = `Stats - ${seasonState.fullLabel} - Ladder ${ladderId}`;
  }

  if (refreshButton) {
    refreshButton.disabled = communityStatsState.loading;
    refreshButton.textContent = communityStatsState.loading ? "Loading..." : "Refresh Teams";
  }

  if (!status) return;

  if (communityStatsState.loading) {
    status.className = "community-status community-status-loading";
    status.textContent = communityStatsState.warning || "Loading community data...";
    return;
  }

  if (communityStatsState.error) {
    status.className = "community-status community-status-error";
    status.textContent = communityStatsState.error;
    return;
  }

  if (communityStatsState.warning) {
    status.className = "community-status community-status-warning";
    status.textContent = communityStatsState.warning;
    return;
  }

  if (communityStatsState.loaded) {
    status.className = "community-status community-status-success";
    status.textContent = `Loaded ${communityStatsState.teams.length} teams and ${communityStatsState.players.length} players. Refresh updates teams and ladder values; player stats stay on the daily ranking cache. Sources: community ${communityStatsState.communitySource || "-"}, ladder ${communityStatsState.ladderSource || "-"}, ranking ${communityStatsState.rankingSource || "-"}.`;
    return;
  }

  status.className = "community-status";
  status.textContent = "Open Community to load current data.";
}

function renderCommunityPanelNavigation() {
  document.querySelectorAll("[data-community-panel-target]").forEach(button => {
    const active = button.dataset.communityPanelTarget === communityStatsState.activePanel;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });

  document.querySelectorAll("[data-community-panel]").forEach(panel => {
    panel.hidden = panel.dataset.communityPanel !== communityStatsState.activePanel;
  });
}

function renderCommunityStats() {
  const playerSearch = document.getElementById("community-player-search");

  if (playerSearch && playerSearch.value !== communityStatsState.playerSearch) {
    playerSearch.value = communityStatsState.playerSearch;
  }

  renderCommunityStatus();
  renderCommunityPanelNavigation();
  renderCommunityTeamSortButtons();
  renderCommunityPlayerSortButtons();
  renderCommunityTeamFilter();
  renderCommunityTeamsTable();
  renderCommunityPlayersTable();
  renderCommunityTournaments();
}

function normalizeCommunityLoadOptions(options) {
  if (typeof options === "boolean") {
    return {
      forceTeamRefresh: options,
      refreshPlayers: true,
      forceRankingRefresh: options,
      loadTournaments: true
    };
  }

  return {
    forceTeamRefresh: Boolean(options?.forceTeamRefresh),
    refreshPlayers: options?.refreshPlayers !== false,
    forceRankingRefresh: Boolean(options?.forceRankingRefresh),
    loadTournaments: options?.loadTournaments !== false
  };
}

async function loadCommunityStats(options = {}) {
  if (communityStatsState.loading) return;

  const { forceTeamRefresh, refreshPlayers, forceRankingRefresh, loadTournaments } = normalizeCommunityLoadOptions(options);
  const seasonState = getCurrentCplSeasonState();
  const currentSeason = seasonState.season;
  const ladderId = currentSeason + 36;

  communityStatsState.loading = true;
  communityStatsState.error = "";
  communityStatsState.warning = "Loading community data...";
  communityStatsState.seasonState = seasonState;
  communityStatsState.ladderId = ladderId;
  renderCommunityStats();

  try {
    let communityData;
    let ladderData = null;
    let communitySource = "api";
    let ladderSource = "api";
    const warnings = [];
    const cached = !forceTeamRefresh ? getFreshCommunityStatsCache(currentSeason, ladderId) : null;

    if (cached) {
      communityData = cached.communityData;
      ladderData = cached.ladderData || null;
      communitySource = "cache";
      ladderSource = ladderData ? "cache" : "missing";
    } else {
      try {
        communityData = await fetchJsonWithRetry(buildCommunityDataUrl(), {
          headers: {
            "Accept": "application/json"
          }
        }, "Community data");
      } catch (error) {
        console.warn("CPL community data failed, using demo data", error);
        communityData = getCommunityDemoData();
        ladderData = getCommunityDemoLadderData(ladderId);
        communitySource = "demo";
        ladderSource = "demo";
        warnings.push(`Community data failed: ${error?.message || error}. Showing demo data for local UI preview.`);
      }

      if (communitySource !== "demo") {
        try {
          communityStatsState.warning = "Loading ladder data...";
          renderCommunityStatus();
          ladderData = await fetchJsonWithRetry(buildLadderDataUrl(ladderId), {
            headers: {
              "Accept": "application/json"
            }
          }, "Ladder data");
        } catch (error) {
          console.warn("CPL community ladder data failed, using demo ladder data", error);
          ladderData = getCommunityDemoLadderData(ladderId);
          ladderSource = "demo";
          warnings.push(`Ladder data failed: ${error?.message || error}. Showing demo ladder values.`);
          communityStatsState.warning = warnings[warnings.length - 1];
        }

        if (ladderData && ladderSource !== "demo") {
          setCommunityStatsCache({
            season: currentSeason,
            ladderId,
            communityData,
            ladderData
          });
        }
      }
    }

    const communityTeams = normalizeCommunityTeams(communityData);
    const ladderEntries = ladderData ? normalizeLadderEntries(ladderData) : [];
    const joinedTeams = joinCommunityTeamsWithLadder(communityTeams, ladderEntries);
    saveCommunityRankingBaselineIfSeasonEnd(seasonState, joinedTeams);
    const teamsWithTrends = applyCommunityRankingTrends(joinedTeams, seasonState);

    communityStatsState.communityName = getCommunityDisplayName(communityData);
    communityStatsState.teams = teamsWithTrends;
    communityStatsState.communitySource = communitySource;
    communityStatsState.ladderSource = ladderSource;

    let rankingPlayersLoaded = communityStatsState.players.length;
    let communityPlayers = syncCommunityPlayersWithTeams(communityStatsState.players, teamsWithTrends);
    const shouldLoadPlayers = refreshPlayers || !communityPlayers.length || communityStatsState.playersSeason !== currentSeason;

    if (shouldLoadPlayers) {
      if (communitySource === "demo") {
        const demoRankingPlayers = getCommunityDemoRankingPlayers(teamsWithTrends);
        rankingPlayersLoaded = demoRankingPlayers.length;
        communityPlayers = normalizeCommunityRankingPlayers(demoRankingPlayers, teamsWithTrends);
        communityStatsState.rankingSource = "demo";
        communityStatsState.playersSeason = currentSeason;
      } else {
        try {
          communityStatsState.warning = "Loading daily player rankings...";
          renderCommunityStatus();
          const rankingResult = await loadRankingDataWithCache(forceRankingRefresh, message => {
            communityStatsState.warning = message;
            renderCommunityStatus();
          }, currentSeason);

          rankingPlayersLoaded = rankingResult.players.length;
          communityPlayers = normalizeCommunityRankingPlayers(rankingResult.players, teamsWithTrends);
          communityStatsState.rankingSource = rankingResult.source;
          communityStatsState.playersSeason = currentSeason;
        } catch (error) {
          console.warn("CPL community ranking data failed, using demo player data", error);
          const demoRankingPlayers = getCommunityDemoRankingPlayers(teamsWithTrends);
          rankingPlayersLoaded = demoRankingPlayers.length;
          communityPlayers = normalizeCommunityRankingPlayers(demoRankingPlayers, teamsWithTrends);
          communityStatsState.rankingSource = "demo";
          communityStatsState.playersSeason = currentSeason;
          warnings.push(`Ranking data failed: ${error?.message || error}. Showing demo players.`);
        }
      }
    } else {
      communityStatsState.rankingSource = communityStatsState.rankingSource || "unchanged";
    }

    communityStatsState.players = communityPlayers;
    communityStatsState.loaded = true;
    communityStatsState.error = "";
    communityStatsState.warning = warnings.join(" ");
    communityStatsState.lastUpdated = new Date().toISOString();

    console.info("CPL community stats loaded", {
      currentSeason,
      seasonDay: seasonState.seasonDay,
      ladderId,
      communityTeamsFound: communityTeams.length,
      ladderEntriesFound: ladderEntries.length,
      rankingPlayersLoaded,
      communityPlayersMatched: communityPlayers.length
    });
  } catch (error) {
    console.error("CPL community data failed", error);
    communityStatsState.loaded = false;
    communityStatsState.error = error?.message || "Community data failed.";
    communityStatsState.warning = "";
    communityStatsState.teams = [];
    communityStatsState.players = [];
  } finally {
    communityStatsState.loading = false;
    renderCommunityStats();

    if (loadTournaments && communityStatsState.loaded && !communityTournamentState.loaded && !communityTournamentState.loading) {
      loadCommunityTournaments(false);
    }
  }
}

async function fetchTournamentDetailsForIds(tournamentIds, forceRefresh, warnings) {
  const tournaments = [];
  const sourceParts = [];

  for (const tournamentId of tournamentIds.slice(0, COMMUNITY_TOURNAMENT_FETCH_LIMIT)) {
    try {
      const result = await fetchTournamentDetails(tournamentId, forceRefresh);
      if (result.tournament?.id !== null) {
        tournaments.push(result.tournament);
        sourceParts.push(result.source);
      }
    } catch (error) {
      console.warn("CPL tournament detail failed", { tournamentId, error });
      warnings.push(`Tournament ${tournamentId} failed: ${error?.message || error}.`);
    }
  }

  return {
    tournaments,
    source: sourceParts.includes("api") ? "api" : sourceParts.includes("cache") ? "cache" : ""
  };
}

async function loadCommunityTournaments(forceRefresh = false) {
  if (communityTournamentState.loading) return;

  const seasonState = communityStatsState.seasonState || getCurrentCplSeasonState();
  const season = seasonState.season;
  const communityTeams = getCommunityTournamentTeams();

  communityTournamentState.loading = true;
  communityTournamentState.error = "";
  communityTournamentState.warning = "Loading tournament data...";
  communityTournamentState.season = season;
  renderCommunityTournaments();

  try {
    const warnings = [];
    const sourceParts = [];
    const demoData = getCommunityDemoTournamentData(season);
    let championshipTournaments = [];
    let championshipSummaries = [];
    let eosTournaments = [];
    let eosSummaries = [];

    try {
      const championshipList = await fetchChampionshipTournaments(season, forceRefresh);
      championshipSummaries = championshipList.summaries;
      sourceParts.push(championshipList.source);
      const detailResult = await fetchTournamentDetailsForIds(championshipList.tournamentIds, forceRefresh, warnings);
      championshipTournaments = detailResult.tournaments;
      if (detailResult.source) sourceParts.push(detailResult.source);
    } catch (error) {
      console.warn("CPL championship tournament data failed, using demo data", error);
      championshipTournaments = demoData.championship.map(sanitizeTournamentData);
      championshipSummaries = uniqueTournamentSummaries(demoData.championship, season);
      sourceParts.push("demo");
      warnings.push(`Championship data failed: ${error?.message || error}. Showing demo championship data.`);
    }

    try {
      const officialList = await fetchOfficialTournaments(season, forceRefresh);
      eosSummaries = officialList.summaries;
      sourceParts.push(officialList.source);
      const detailResult = await fetchTournamentDetailsForIds(officialList.tournamentIds, forceRefresh, warnings);
      eosTournaments = detailResult.tournaments;
      if (detailResult.source) sourceParts.push(detailResult.source);
    } catch (error) {
      console.warn("CPL official tournament data failed, using demo data", error);
      eosTournaments = demoData.eos.map(sanitizeTournamentData);
      eosSummaries = uniqueTournamentSummaries(demoData.eos, season);
      sourceParts.push("demo");
      warnings.push(`EOS data failed: ${error?.message || error}. Showing demo EOS data.`);
    }

    communityTournamentState.championshipItems = buildTournamentItems(championshipTournaments, communityTeams, "championship", championshipSummaries);
    communityTournamentState.eosItems = buildTournamentItems(eosTournaments, communityTeams, "eos", eosSummaries);
    communityTournamentState.source = sourceParts.includes("api")
      ? "api"
      : sourceParts.includes("cache")
        ? "cache"
        : sourceParts.includes("demo")
          ? "demo"
          : "";
    communityTournamentState.loaded = true;
    communityTournamentState.error = "";
    communityTournamentState.warning = warnings.join(" ");
    communityTournamentState.lastUpdated = new Date().toISOString();
  } catch (error) {
    console.error("CPL tournament overview failed", error);
    communityTournamentState.loaded = false;
    communityTournamentState.error = error?.message || "Tournament overview failed.";
    communityTournamentState.warning = "";
    communityTournamentState.championshipItems = [];
    communityTournamentState.eosItems = [];
  } finally {
    communityTournamentState.loading = false;
    renderCommunityTournaments();
  }
}

function ensureCommunityStatsLoaded() {
  if (!communityStatsState.loaded && !communityStatsState.loading) {
    loadCommunityStats(false);
    return;
  }

  renderCommunityStats();

  if (!communityTournamentState.loaded && !communityTournamentState.loading) {
    loadCommunityTournaments(false);
  }
}

function setupCommunityStats() {
  document.getElementById("community-refresh-button")?.addEventListener("click", () => {
    loadCommunityStats({
      forceTeamRefresh: true,
      refreshPlayers: false
    });
  });

  document.getElementById("community-player-search")?.addEventListener("input", event => {
    communityStatsState.playerSearch = event.target.value || "";
    renderCommunityStats();
  });

  document.getElementById("community-player-team-filter")?.addEventListener("change", event => {
    communityStatsState.playerTeamId = event.target.value || "";
    renderCommunityStats();
  });

  document.getElementById("community-tournament-refresh-button")?.addEventListener("click", () => {
    loadCommunityTournaments(true);
  });

  document.querySelectorAll("[data-community-tournament-view]").forEach(button => {
    button.addEventListener("click", () => {
      communityTournamentState.view = button.dataset.communityTournamentView === "eos" ? "eos" : "championship";
      renderCommunityTournaments();
    });
  });

  document.getElementById("community-tournament-team-filter")?.addEventListener("change", event => {
    communityTournamentState.teamId = event.target.value || "";
    renderCommunityTournaments();
  });

  document.querySelectorAll("[data-community-panel-target]").forEach(button => {
    button.addEventListener("click", () => {
      const panel = button.dataset.communityPanelTarget || "tournaments";
      communityStatsState.activePanel = ["teams", "players", "tournaments"].includes(panel) ? panel : "teams";
      renderCommunityStats();
    });
  });

  document.querySelectorAll("[data-community-team-sort]").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.communityTeamSort;

      if (communityStatsState.teamSort.key === key) {
        communityStatsState.teamSort.direction = communityStatsState.teamSort.direction === "asc" ? "desc" : "asc";
      } else {
        communityStatsState.teamSort.key = key;
        communityStatsState.teamSort.direction = key === "fame" ? "desc" : "asc";
      }

      renderCommunityStats();
    });
  });

  document.querySelectorAll("[data-community-player-sort]").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.communityPlayerSort;

      if (communityStatsState.playerSort.key === key) {
        communityStatsState.playerSort.direction = communityStatsState.playerSort.direction === "asc" ? "desc" : "asc";
      } else {
        communityStatsState.playerSort.key = key;
        communityStatsState.playerSort.direction = getDefaultCommunityPlayerSortDirection(key);
      }

      renderCommunityStats();
    });
  });

  renderCommunityStats();
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
    currentSeasonDay: String(getTryoutCurrentSeasonDay()),
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
  if (currentSeasonDay) currentSeasonDay.value = String(getCurrentCplSeasonState().seasonDay);
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
  setupCommunityStats();
  document.getElementById("compare-button")?.addEventListener("click", runComparison);
  document.getElementById("transfer-suggestions")?.addEventListener("click", handleTransferSuggestionClick);
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
