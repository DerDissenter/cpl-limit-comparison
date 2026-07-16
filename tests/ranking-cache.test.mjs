import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

function createLocalStorage(initial = {}, throwOnSet = false) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      if (throwOnSet) throw new DOMException("Quota exceeded", "QuotaExceededError");
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    values
  };
}

function loadFrontend({ localStorage = createLocalStorage(), fetchImpl = fetch } = {}) {
  const source = fs.readFileSync(new URL("../main.js", import.meta.url), "utf8");
  const noop = () => {};
  const document = {
    addEventListener: noop,
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({
      click: noop,
      remove: noop,
      appendChild: noop,
      setAttribute: noop,
      style: {},
      dataset: {},
      classList: { add: noop, remove: noop, toggle: noop, contains: () => false }
    }),
    body: { appendChild: noop }
  };
  const window = { document, localStorage, URL, Blob, setInterval: () => 1, clearInterval: noop };
  const context = {
    console: { ...console, info() {}, warn() {} },
    fetch: fetchImpl,
    URL,
    URLSearchParams,
    Blob,
    DOMException,
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
    alert: noop
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "main.js" });
  return context;
}

function loadWorker(fetchImpl) {
  const source = fs
    .readFileSync(new URL("../worker/worker.js", import.meta.url), "utf8")
    .replace("export default {", "globalThis.workerHandler = {");
  const context = {
    console,
    fetch: fetchImpl,
    Request,
    Response,
    Headers,
    URL,
    URLSearchParams,
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
    JSON,
    encodeURIComponent
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "worker.js" });
  return context.workerHandler;
}

class FakeKv {
  constructor() {
    this.values = new Map();
    this.reads = 0;
    this.writes = 0;
  }

  async get(key, type) {
    this.reads += 1;
    const value = this.values.get(key);
    if (value === undefined) return null;
    return type === "json" ? JSON.parse(value) : value;
  }

  async put(key, value) {
    this.writes += 1;
    this.values.set(key, String(value));
  }
}

function getCurrentCplDay(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date).map(part => [part.type, part.value]));
  const day = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  return new Date(Number(parts.hour) < 2 ? day - 86400000 : day).toISOString().slice(0, 10);
}

test("ladder view is derived from the official browser cache without a fetch", async () => {
  const players = [
    {
      id: 1,
      playerId: 1,
      teamId: 10,
      rank: 50,
      games: 8,
      kills: 100,
      deaths: 80,
      headshots: 30,
      mvps: 1,
      matchTypeStats: { ladder: { games: 4, kills: 60, deaths: 30, headshots: 20, mvps: 2 } }
    }
  ];
  const storage = createLocalStorage({
    cplRankingPlayersCache_v7: JSON.stringify({
      schemaVersion: 8,
      timestamp: Date.now(),
      season: 13,
      country: "All countries",
      type: "official",
      limit: 100,
      players
    })
  });
  const app = loadFrontend({
    localStorage: storage,
    fetchImpl: async () => { throw new Error("unexpected fetch"); }
  });

  const result = await app.loadRankingDataWithCache(false, () => {}, 13, "ladder");
  assert.equal(result.source, "cache");
  assert.equal(result.players[0].games, 4);
  assert.equal(result.players[0].kills, 60);
  assert.equal(result.players[0].kdRatio, 2);
});

test("community cache quota errors do not break the app", () => {
  const app = loadFrontend({ localStorage: createLocalStorage({}, true) });
  assert.doesNotThrow(() => app.setCommunityStatsCache({
    season: 13,
    ladderId: 49,
    communityData: { name: "Community", teams: [{ teamId: 10, teamName: "Team" }] },
    ladderData: { teams: [{ teamId: 10, position: 1, points: 10 }] }
  }));
});

test("tournament cache removes the legacy key and tolerates quota errors", () => {
  const storage = createLocalStorage({
    cplCommunityTournamentCache_v1: JSON.stringify({ stale: true })
  }, true);
  const app = loadFrontend({ localStorage: storage });

  assert.doesNotThrow(() => app.setCommunityTournamentCacheEntry("season:13", { tournaments: [] }));
  assert.equal(storage.values.has("cplCommunityTournamentCache_v1"), false);
  assert.equal(storage.values.has("cplCommunityTournamentCache_v2"), false);
});

test("championship refresh and CPL league URLs use the supported routes", () => {
  const app = loadFrontend();

  assert.equal(
    app.buildChampionshipDataUrl(13),
    "https://cpl-proxy.dissenter-cpl-tools.workers.dev/championships/13/__data.json"
  );
  assert.equal(
    app.buildChampionshipDataUrl(13, true),
    "https://cpl-proxy.dissenter-cpl-tools.workers.dev/championships/13/__data.json?refresh=true"
  );
  assert.equal(app.buildCplLeagueUrl(901), "https://www.cplmanager.com/cpl/leagues/901");
});

test("daily Worker refresh stores one Official snapshot and reuses it", async () => {
  const upstreamUrls = [];
  const page = {
    type: "data",
    nodes: [{ data: [{ totalCount: 1, limit: 2, page: 1, rankingPlayers: 3 }, 1, 100, []] }]
  };
  const worker = loadWorker(async url => {
    upstreamUrls.push(String(url));
    return Response.json(page);
  });
  const kv = new FakeKv();
  const scheduledTime = Date.parse("2026-07-16T01:00:00.000Z");

  let pending;
  await worker.scheduled({ scheduledTime }, { CPL_CACHE: kv }, {
    waitUntil(promise) { pending = promise; }
  });
  await pending;

  assert.equal(upstreamUrls.length, 1);
  assert.match(upstreamUrls[0], /type=official/);
  assert.equal(kv.writes, 1);
  assert.equal([...kv.values.keys()].filter(key => key.includes("rankings:players:snapshot:v2")).length, 1);

  await worker.scheduled({ scheduledTime }, { CPL_CACHE: kv }, {
    waitUntil(promise) { pending = promise; }
  });
  await pending;
  assert.equal(upstreamUrls.length, 1);
  assert.equal(kv.writes, 1);
});

test("Ladder bundle requests reuse the Official snapshot", async () => {
  const worker = loadWorker(async () => { throw new Error("unexpected CPL fetch"); });
  const kv = new FakeKv();
  const snapshotBody = JSON.stringify({ type: "official", pages: [] });
  const cplDay = getCurrentCplDay();
  const key = `rankings:players:snapshot:v2:limit=100:country=all%20countries:type=official:season=13:cpl-day=${cplDay}`;
  kv.values.set(key, JSON.stringify({ cachedAt: Date.now(), contentType: "application/json", body: snapshotBody }));

  const response = await worker.fetch(new Request(
    "https://worker.test/rankings/players/all?limit=100&country=All+countries&type=ladder&season=13"
  ), { CPL_CACHE: kv });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-Cache-Status"), "HIT");
  assert.deepEqual(await response.json(), { type: "official", pages: [] });
  assert.equal(kv.reads, 1);
});
