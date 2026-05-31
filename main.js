let comparisonChart = null;
let playerCounter = 0;

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

function getSkillWeights() {
  const weights = {};

  document.querySelectorAll(".skill-weight").forEach(input => {
    const skillName = input.dataset.skill;
    const value = Number(input.value);

    weights[skillName] = !Number.isNaN(value) && value > 0 ? value : 0;
  });

  return weights;
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

function getSelectedLimitAverage(player, selectedSkills, weights = {}, weightsEnabled = false) {
  let weightedSum = 0;
  let totalWeight = 0;

  selectedSkills.forEach(skillName => {
    const skill = player.skills.find(item => item.name === skillName);

    if (!skill || skill.max === null || Number.isNaN(Number(skill.max))) {
      return;
    }

    const limit = Number(skill.max);
    const weight = weightsEnabled ? Number(weights[skillName] || 0) : 1;

    if (weight <= 0) return;

    weightedSum += limit * weight;
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

function getAgeAtSeason(playerAgeText, seasonOffset) {
  const { age, birthdayDay } = parseAgeString(playerAgeText);

  if (age === null) return "unknown";

  const ageAtSeason = age + seasonOffset;

  if (birthdayDay !== null) {
    return `${ageAtSeason}yo (day ${birthdayDay})`;
  }

  return `${ageAtSeason}yo`;
}

function buildProjection(player, selectedSkills, startGames, heartMode, gamesPerSeason, seasonCount, loyal = false, weights = {}, weightsEnabled = false) {
  const baseLimit = getSelectedLimitAverage(player, selectedSkills, weights, weightsEnabled);
  const result = [];

  for (let season = 0; season <= seasonCount; season++) {
    const games = startGames + season * gamesPerSeason;
    const heartBonus = getHeartBonus(games, heartMode, loyal);
    const effectiveLimit = baseLimit * (1 + heartBonus);

    result.push({
      season,
      games,
      baseLimit,
      heartBonus,
      effectiveLimit,
      loyal
    });
  }

  return result;
}

function getBestPlayerAtSeason(players, seasonIndex) {
  return players
    .map(player => ({
      player,
      value: player.projection[seasonIndex].effectiveLimit
    }))
    .sort((a, b) => b.value - a.value)[0];
}

function getLeaderChanges(players) {
  const changes = [];
  let previousLeader = null;

  const seasonLength = players[0]?.projection.length || 0;

  for (let i = 0; i < seasonLength; i++) {
    const leader = getBestPlayerAtSeason(players, i);

    if (!previousLeader) {
      previousLeader = leader.player.playerName;
      continue;
    }

    if (leader.player.playerName !== previousLeader) {
      changes.push({
        season: players[0].projection[i].season,
        playerName: leader.player.playerName,
        value: leader.value
      });

      previousLeader = leader.player.playerName;
    }
  }

  return changes;
}

function renderChart(players, weightsEnabled = false) {
  const canvas = document.getElementById("comparison-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (comparisonChart) {
    comparisonChart.destroy();
  }

  const labels = players[0].projection.map(point => `S${point.season}`);

  comparisonChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: players.map(player => ({
        label: player.playerName || "Unknown Player",
        data: player.projection.map(point => Number(point.effectiveLimit.toFixed(2))),
        tension: 0.25,
        pointRadius: 3,
        pointHoverRadius: 5
      }))
    },
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
                const point = player.projection[context.dataIndex];

                return [
                `Games: ${point.games}`,
                `Age: ${getAgeAtSeason(player.playerAge, point.season)}`,
                `${weightsEnabled ? "Base Weighted Score" : "Base Limit"}: ${point.baseLimit.toFixed(2)}`,
                `Heart: ${(point.heartBonus * 100).toFixed(1)}%`,
                `Loyal: ${player.loyal ? "Yes" : "No"}`
                ];
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
            text: weightsEnabled ? "Weighted Score + Heart Bonus" : "Limit + Heart Bonus"
          }
        }
      }
    }
  });
}

function renderSummary(players, selectedSkills, weights = {}, weightsEnabled = false) {
  const summary = document.getElementById("summary");
  if (!summary) return;
    const modeText = weightsEnabled ? "Weighted score" : "Equal weighting";

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
        <br>
        ${weightsEnabled ? "Base Weighted Score" : "Base Limit"}: ${start.baseLimit.toFixed(2)}
        Loyal: ${player.loyal ? "Yes" : "No"}
        ${warning}
      </p>
    `;
  }).join("");

  const winnerAtStart = getBestPlayerAtSeason(players, 0);
  const winnerAtEnd = getBestPlayerAtSeason(players, players[0].projection.length - 1);
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
    <label class="player-loyal-label">
  <input class="player-loyal" type="checkbox" ${initialData.loyal ? "checked" : ""}>
  Loyal
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
  });

  container.appendChild(card);
  updatePlayerCardTitles();
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

    return {
    index,
    inputText,
    startGames,
    heartMode,
    loyal
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

      if (!player.skills.length) return null;

    return {
    ...player,
    startGames: playerInput.startGames,
    heartMode: playerInput.heartMode,
    loyal: playerInput.loyal,
    projection: buildProjection(
        player,
        selectedSkills,
        playerInput.startGames,
        playerInput.heartMode,
        gamesPerSeason,
        seasonCount,
        playerInput.loyal,
        weights,
        weightsEnabled
    )
    };
    })
    .filter(Boolean);

  if (parsedPlayers.length < 2) {
    alert("Please paste at least two valid players.");
    return;
  }

  renderChart(parsedPlayers, weightsEnabled);
  renderSummary(parsedPlayers, selectedSkills, weights, weightsEnabled);
}


document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("compare-button")?.addEventListener("click", runComparison);
  document.getElementById("add-player-button")?.addEventListener("click", () => createPlayerCard());

  if (!document.querySelector(".player-panel")) {
    createPlayerCard();
    createPlayerCard();
  }
});