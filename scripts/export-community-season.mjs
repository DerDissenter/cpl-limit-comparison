import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const MAIN_JS_PATH = path.join(ROOT_DIR, "main.js");
const DEFAULT_OUTPUT_DIR = path.join(ROOT_DIR, "exports", "community-season-snapshots");
const COMMUNITY_ID = 121;
const CPL_SEASON_DAYS = 35;

function parseArgs(argv) {
  const options = {
    season: null,
    outputDir: DEFAULT_OUTPUT_DIR,
    includeRaw: false,
    onlySeasonEnd: false,
    skipExisting: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--season") {
      options.season = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith("--season=")) {
      options.season = Number(arg.slice("--season=".length));
      continue;
    }

    if (arg === "--out") {
      options.outputDir = path.resolve(ROOT_DIR, argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith("--out=")) {
      options.outputDir = path.resolve(ROOT_DIR, arg.slice("--out=".length));
      continue;
    }

    if (arg === "--include-raw") {
      options.includeRaw = true;
      continue;
    }

    if (arg === "--only-season-end") {
      options.onlySeasonEnd = true;
      continue;
    }

    if (arg === "--skip-existing") {
      options.skipExisting = true;
      continue;
    }
  }

  if (options.season !== null && (!Number.isFinite(options.season) || options.season < 1)) {
    throw new Error("Invalid --season value.");
  }

  return options;
}

function createLocalStorageShim() {
  const storage = new Map();

  return {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    },
    clear() {
      storage.clear();
    }
  };
}

function createDocumentShim() {
  const emptyClassList = {
    add() {},
    remove() {},
    toggle() {},
    contains() {
      return false;
    }
  };

  return {
    addEventListener() {},
    getElementById() {
      return null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    createElement() {
      return {
        click() {},
        remove() {},
        appendChild() {},
        setAttribute() {},
        style: {},
        dataset: {},
        classList: emptyClassList
      };
    },
    body: {
      appendChild() {}
    }
  };
}

async function loadAppRuntime() {
  const source = await fs.readFile(MAIN_JS_PATH, "utf8");
  const localStorage = createLocalStorageShim();
  const document = createDocumentShim();
  const window = {
    document,
    localStorage,
    URL,
    Blob,
    setInterval() {
      return 1;
    },
    clearInterval() {}
  };

  const context = {
    console,
    fetch,
    URL,
    URLSearchParams,
    Blob,
    Intl,
    Date,
    Math,
    Number,
    String,
    Array,
    Object,
    Map,
    Set,
    WeakSet,
    Promise,
    setTimeout,
    clearTimeout,
    window,
    document,
    localStorage,
    alert() {}
  };

  vm.createContext(context);
  vm.runInContext(source, context, { filename: MAIN_JS_PATH });
  return context;
}

function getSeasonState(app, season) {
  const currentState = app.getCurrentCplSeasonState();

  if (!season || season === currentState.season) {
    return currentState;
  }

  return {
    season,
    seasonDay: CPL_SEASON_DAYS,
    label: `S${season}`,
    fullLabel: `S${season} D${CPL_SEASON_DAYS}`
  };
}

function getDateStamp(app) {
  if (typeof app.getCommunityExportDateStamp === "function") {
    return app.getCommunityExportDateStamp();
  }

  return new Date().toISOString().slice(0, 10);
}

function getPlayersByTeam(teams, players) {
  return teams.map(team => ({
    teamId: team.teamId,
    teamName: team.teamName,
    players: players.filter(player => String(player.teamId) === String(team.teamId))
  }));
}

function getTournamentItemsByTeam(teams, tournamentItems) {
  return teams.map(team => ({
    teamId: team.teamId,
    teamName: team.teamName,
    tournaments: tournamentItems.filter(item => String(item?.team?.teamId) === String(team.teamId))
  }));
}

async function fetchJson(app, url, label) {
  return app.fetchJsonWithRetry(url, {
    headers: {
      Accept: "application/json"
    }
  }, label);
}

async function buildSnapshot(app, options) {
  const seasonState = getSeasonState(app, options.season);
  const season = seasonState.season;
  const ladderId = season + 36;
  const warnings = [];

  console.info(`Loading community ${COMMUNITY_ID} for ${seasonState.fullLabel}...`);
  const communityData = await fetchJson(app, app.buildCommunityDataUrl(), "Community data");
  const ladderData = await fetchJson(app, app.buildLadderDataUrl(ladderId), "Ladder data");

  const communityTeams = app.normalizeCommunityTeams(communityData);
  const ladderEntries = app.normalizeLadderEntries(ladderData);
  const teams = app.joinCommunityTeamsWithLadder(communityTeams, ladderEntries);

  if (!teams.length) {
    throw new Error("No community teams could be parsed.");
  }

  console.info(`Loading ranking players for season ${season}...`);
  const rankingResult = await app.loadRankingDataWithCache(true, message => console.info(message), season);
  const players = app.normalizeCommunityRankingPlayers(rankingResult.players, teams);

  if (!players.length) {
    throw new Error("No community players could be matched from ranking data.");
  }

  console.info(`Loading tournament data for season ${season}...`);
  const championshipList = await app.fetchChampionshipTournaments(season, true);
  const championshipDetails = await app.fetchTournamentDetailsForIds(
    championshipList.tournamentIds,
    true,
    warnings
  );
  const championshipItems = app.buildTournamentItems(
    championshipDetails.tournaments,
    teams,
    "championship",
    championshipList.summaries
  );

  const officialList = await app.fetchOfficialTournaments(season, true);
  const eosDetails = await app.fetchTournamentDetailsForIds(
    officialList.tournamentIds,
    true,
    warnings
  );
  const eosItems = app.buildTournamentItems(
    eosDetails.tournaments,
    teams,
    "eos",
    officialList.summaries
  );

  const tournamentItems = [...championshipItems, ...eosItems];
  const snapshot = {
    schemaVersion: 1,
    exportType: "community-season-project-snapshot",
    exportedAt: new Date().toISOString(),
    community: {
      id: COMMUNITY_ID,
      name: app.getCommunityDisplayName(communityData)
    },
    season: {
      season,
      seasonDay: seasonState.seasonDay,
      label: seasonState.label,
      fullLabel: seasonState.fullLabel,
      isSeasonEnd: seasonState.seasonDay === CPL_SEASON_DAYS,
      ladderId
    },
    sources: {
      community: app.buildCommunityDataUrl(),
      ladder: app.buildLadderDataUrl(ladderId),
      ranking: "proxy rankings/players",
      championship: app.buildChampionshipDataUrl(season),
      eos: app.buildOfficialTournamentsDataUrl()
    },
    counts: {
      teams: teams.length,
      players: players.length,
      tournamentTeams: tournamentItems.length,
      championshipItems: championshipItems.length,
      eosItems: eosItems.length
    },
    warnings,
    teams,
    players,
    playersByTeam: getPlayersByTeam(teams, players),
    tournaments: {
      championship: championshipItems,
      eos: eosItems,
      byTeam: getTournamentItemsByTeam(teams, tournamentItems)
    }
  };

  if (options.includeRaw) {
    snapshot.raw = {
      communityData,
      ladderData,
      championshipList,
      officialList
    };
  }

  return snapshot;
}

async function writeSnapshot(app, snapshot, outputDir) {
  const dateStamp = getDateStamp(app);
  const fileName = `cpl-community-${COMMUNITY_ID}-season-${snapshot.season.season}-day-${String(snapshot.season.seasonDay).padStart(2, "0")}-${dateStamp}.json`;
  const filePath = path.join(outputDir, fileName);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return filePath;
}

async function hasExistingSeasonSnapshot(outputDir, season) {
  try {
    const entries = await fs.readdir(outputDir);
    const prefix = `cpl-community-${COMMUNITY_ID}-season-${season}-day-${String(CPL_SEASON_DAYS).padStart(2, "0")}-`;
    return entries.some(entry => entry.startsWith(prefix) && entry.endsWith(".json"));
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const app = await loadAppRuntime();
  const seasonState = getSeasonState(app, options.season);

  if (options.onlySeasonEnd && seasonState.seasonDay !== CPL_SEASON_DAYS) {
    console.info(`No export: ${seasonState.fullLabel} is not season day ${CPL_SEASON_DAYS}.`);
    return;
  }

  if (options.skipExisting && await hasExistingSeasonSnapshot(options.outputDir, seasonState.season)) {
    console.info(`No export: season ${seasonState.season} already has a day ${CPL_SEASON_DAYS} snapshot.`);
    return;
  }

  const snapshot = await buildSnapshot(app, options);
  const filePath = await writeSnapshot(app, snapshot, options.outputDir);

  console.info(`Wrote ${path.relative(ROOT_DIR, filePath)}`);
  console.info(`Teams: ${snapshot.counts.teams}, players: ${snapshot.counts.players}, tournament entries: ${snapshot.counts.tournamentTeams}`);
}

main().catch(error => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
