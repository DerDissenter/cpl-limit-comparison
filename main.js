let comparisonChart = null;

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

function parsePlayerText(text) {
  const lines = text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const parsedSkills = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const normalizedLine = MOBILE_ALIAS[currentLine.toUpperCase()] || currentLine;

    const inlineMatch = currentLine.match(/^(\w+)\s+(\d+)\s*\/\s*(\d+|\?)$/i);

    if (inlineMatch) {
      const skillName = MOBILE_ALIAS[inlineMatch[1].toUpperCase()] || inlineMatch[1];

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

  return {
    playerName: lines[0] || "Unknown Player",
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

function getHeartBonusByGames(games) {
  if (games >= 800) return 0.08;
  if (games >= 400) return 0.05;
  if (games >= 200) return 0.03;
  if (games >= 100) return 0.01;
  if (games >= 50) return 0.005;
  return 0;
}

function getHeartBonus(games, mode) {
  if (mode === "constant4") return 0.04;
  return getHeartBonusByGames(games);
}

function getSelectedLimitAverage(player, selectedSkills) {
  const values = selectedSkills
    .map(skillName => {
      const skill = player.skills.find(item => item.name === skillName);
      return skill && skill.max !== null ? Number(skill.max) : null;
    })
    .filter(value => value !== null && !Number.isNaN(value));

  if (values.length === 0) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
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

function buildProjection(player, selectedSkills, startGames, heartMode, gamesPerSeason, seasonCount) {
  const baseLimit = getSelectedLimitAverage(player, selectedSkills);
  const result = [];

  for (let season = 0; season <= seasonCount; season++) {
    const games = startGames + season * gamesPerSeason;
    const heartBonus = getHeartBonus(games, heartMode);
    const effectiveLimit = baseLimit * (1 + heartBonus);

    result.push({
      season,
      games,
      baseLimit,
      heartBonus,
      effectiveLimit
    });
  }

  return result;
}

function findLeadChange(player1, player2, projection1, projection2) {
  const startDiff = projection1[0].effectiveLimit - projection2[0].effectiveLimit;

  if (startDiff === 0) {
    return `${player1.playerName} and ${player2.playerName} start equal.`;
  }

  const initialLeader = startDiff > 0 ? player1 : player2;

  for (let i = 1; i < projection1.length; i++) {
    const diff = projection1[i].effectiveLimit - projection2[i].effectiveLimit;

    if (startDiff > 0 && diff < 0) {
      return `${player2.playerName} overtakes ${player1.playerName} in Season ${projection1[i].season}.`;
    }

    if (startDiff < 0 && diff > 0) {
      return `${player1.playerName} overtakes ${player2.playerName} in Season ${projection1[i].season}.`;
    }
  }

  return `${initialLeader.playerName} starts ahead and stays ahead in the selected timeframe.`;
}

function renderChart(player1, player2, projection1, projection2) {
  const canvas = document.getElementById("comparison-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (comparisonChart) {
    comparisonChart.destroy();
  }

  comparisonChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: projection1.map(point => `S${point.season}`),
      datasets: [
        {
          label: player1.playerName || "Player 1",
          data: projection1.map(point => Number(point.effectiveLimit.toFixed(2))),
          tension: 0.25
        },
        {
          label: player2.playerName || "Player 2",
          data: projection2.map(point => Number(point.effectiveLimit.toFixed(2))),
          tension: 0.25
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        tooltip: {
          callbacks: {
            afterLabel: function(context) {
              const projection = context.datasetIndex === 0 ? projection1 : projection2;
              const player = context.datasetIndex === 0 ? player1 : player2;
              const point = projection[context.dataIndex];

              return [
                `Games: ${point.games}`,
                `Age: ${getAgeAtSeason(player.playerAge, point.season)}`,
                `Base Limit: ${point.baseLimit.toFixed(2)}`,
                `Heart: ${(point.heartBonus * 100).toFixed(1)}%`
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
            text: "Limit + Heart Bonus"
          }
        }
      }
    }
  });
}

function renderSummary(player1, player2, projection1, projection2, selectedSkills) {
  const summary = document.getElementById("summary");
  if (!summary) return;

  const p1Start = projection1[0];
  const p1End = projection1[projection1.length - 1];

  const p2Start = projection2[0];
  const p2End = projection2[projection2.length - 1];

  summary.innerHTML = `
    <h2>Summary</h2>

    <p><strong>Compared skills:</strong> ${selectedSkills.join(", ")}</p>

    <p>
      <strong>${player1.playerName || "Player 1"}:</strong>
      ${p1Start.effectiveLimit.toFixed(2)} → ${p1End.effectiveLimit.toFixed(2)}
      <br>
      Base Limit: ${p1Start.baseLimit.toFixed(2)}
    </p>

    <p>
      <strong>${player2.playerName || "Player 2"}:</strong>
      ${p2Start.effectiveLimit.toFixed(2)} → ${p2End.effectiveLimit.toFixed(2)}
      <br>
      Base Limit: ${p2Start.baseLimit.toFixed(2)}
    </p>

    <p><strong>Lead change:</strong> ${findLeadChange(player1, player2, projection1, projection2)}</p>
  `;
}

function runComparison() {
  const player1Text = document.getElementById("player1-input").value.trim();
  const player2Text = document.getElementById("player2-input").value.trim();

  if (!player1Text || !player2Text) {
    alert("Please paste both players first.");
    return;
  }

  const player1 = parsePlayerText(player1Text);
  const player2 = parsePlayerText(player2Text);

  if (!player1.skills.length || !player2.skills.length) {
    alert("Could not parse both players.");
    return;
  }

  const selectedSkills = getSelectedSkills();

  if (selectedSkills.length === 0) {
    alert("Please select at least one skill.");
    return;
  }

  const player1StartGames = Number(document.getElementById("player1-games").value) || 0;
  const player2StartGames = Number(document.getElementById("player2-games").value) || 0;

  const player1HeartMode = document.getElementById("player1-heart-mode").value;
  const player2HeartMode = document.getElementById("player2-heart-mode").value;

  const gamesPerSeason = Number(document.getElementById("games-per-season").value) || 57;
  const seasonCount = Number(document.getElementById("season-count").value) || 15;

  const projection1 = buildProjection(
    player1,
    selectedSkills,
    player1StartGames,
    player1HeartMode,
    gamesPerSeason,
    seasonCount
  );

  const projection2 = buildProjection(
    player2,
    selectedSkills,
    player2StartGames,
    player2HeartMode,
    gamesPerSeason,
    seasonCount
  );

  renderChart(player1, player2, projection1, projection2);
  renderSummary(player1, player2, projection1, projection2, selectedSkills);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("compare-button")?.addEventListener("click", runComparison);
});