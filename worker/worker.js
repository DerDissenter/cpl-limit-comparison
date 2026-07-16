const ALLOWED_ORIGIN = "https://derdissenter.github.io";
const CPL_BASE = "https://www.cplmanager.com";

const TRANSFER_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const RANKING_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RANKING_SNAPSHOT_CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const RANKING_SNAPSHOT_VERSION = "v2";
const RANKING_BUNDLE_LIMIT = "100";
const RANKING_BUNDLE_MAX_PAGES = 100;
const CPL_SEASON_DAYS = 35;
const CPL_DAILY_UPDATE_HOUR = 2;
const RANKING_DAILY_REFRESH_HOUR = 3;
const TRANSFER_WATCHER_DAILY_HOUR = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CPL_SEASON_ANCHOR = {
  season: 12,
  seasonDay: 28,
  gameDateUtc: Date.UTC(2026, 5, 14)
};
const COMMUNITY_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const LADDER_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LADDER_MATCHES_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LADDER_MATCHES_LIVE_CACHE_TTL_MS = 60 * 1000; // 1 minute during live result window
const LADDER_MATCHES_LIMIT = "100";
const LADDER_MATCHES_MAX_PAGES = 100;
const LADDER_DAILY_REFRESH_HOUR = 17;
const LEAGUE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LEAGUE_MATCHES_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LEAGUE_MATCHES_LIVE_CACHE_TTL_MS = 60 * 1000; // 1 minute during live result window
const LEAGUE_MATCHES_LIMIT = "100";
const LEAGUE_MATCHES_MAX_PAGES = 100;
const LEAGUE_DAILY_REFRESH_HOUR = 21;
const TOURNAMENT_CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours
const CHAMPIONSHIP_TYPES = new Set(["challengers", "contenders", "championship"]);

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin"
};
const TRANSFER_CACHE_KEY = "transfers:age_range=13-44:limit=5000";
const DISCORD_REPORTED_TTL_SECONDS = 3 * 24 * 60 * 60; // 3 days
const MAX_DISCORD_ALERT_PLAYERS = 10;

const TRANSFER_ALERT_RULES = [
  {
    id: "entertaining-high-fame",
    label: "Entertaining high fame",
    requiredSpecialsAny: ["entertaining"],
    fameRule: {
      fame3ProgressAbove: 3800,
      fameAtLeast: 4
    }
  },
  {
    id: "fire-heart",
    label: "Fire Heart",
    requiredSpecialsAny: ["fire-heart"]
  },
  {
    id: "core-sum-92-age-20-24",
    label: "Aim+Quickness+Determination+Awareness >368",
    minAge: 20,
    maxAge: 24,
    minTotalLimit: 740,
    skillLimitSumAbove: {
      skills: ["aim", "quickness", "determination", "awareness"],
      value: 4 * 92
    }
  },
  {
    id: "fragger-tryhard-core-92-age-20-22",
    label: "Fragger/Tryhard core skills >92",
    minAge: 20,
    maxAge: 22,
    requiredSpecialsAny: ["fragger", "tryhard"],
    minSkillLimitsAbove: {
      aim: 91,
      quickness: 91,
      determination: 91
    }
  },
  {
    id: "loyal-long-lived-core-90-age-20-22",
    label: "Loyal/Long-lived core skills >90",
    minAge: 20,
    maxAge: 22,
    requiredSpecialsAny: ["loyal", "long-lived"],
    minSkillLimitsAbove: {
      aim: 90,
      quickness: 90,
      determination: 90
    }
  }
];

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...extraHeaders
    }
  });
}

function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

function isPositiveInteger(value) {
  return /^[0-9]+$/.test(String(value));
}

function normalizeKeyPart(value) {
  return encodeURIComponent(String(value).trim().toLowerCase());
}

function buildRankingsTargetUrl(incomingUrl) {
  const allowedParams = new Set([
    "page",
    "limit",
    "country",
    "type",
    "season"
  ]);

  for (const key of incomingUrl.searchParams.keys()) {
    if (!allowedParams.has(key)) {
      throw new Error(`Unsupported query parameter: ${key}`);
    }
  }

  const page = incomingUrl.searchParams.get("page") || "1";
  const limit = incomingUrl.searchParams.get("limit") || "200";
  const country = incomingUrl.searchParams.get("country") || "All countries";
  const requestedType = (incomingUrl.searchParams.get("type") || "official").toLowerCase();
  const type = "official";
  const season = incomingUrl.searchParams.get("season") || "12";

  if (!isPositiveInteger(page)) {
    throw new Error("Invalid page parameter");
  }

  if (!isPositiveInteger(limit) || Number(limit) < 1 || Number(limit) > 200) {
    throw new Error("Invalid limit parameter. Max allowed limit is 200.");
  }

  if (!isPositiveInteger(season)) {
    throw new Error("Invalid season parameter");
  }

  if (requestedType !== "official" && requestedType !== "ladder") {
    throw new Error("Unsupported ranking type. Use official or ladder.");
  }

  const targetUrl = new URL(`${CPL_BASE}/cpl/rankings/players/__data.json`);
  targetUrl.searchParams.set("page", page);
  targetUrl.searchParams.set("limit", limit);
  targetUrl.searchParams.set("country", country);
  targetUrl.searchParams.set("type", type);
  targetUrl.searchParams.set("season", season);

  const cacheKey = [
    "rankings:players",
    `page=${normalizeKeyPart(page)}`,
    `limit=${normalizeKeyPart(limit)}`,
    `country=${normalizeKeyPart(country)}`,
    `type=${normalizeKeyPart(type)}`,
    `season=${normalizeKeyPart(season)}`
  ].join(":");

  return {
    targetUrl,
    cacheKey,
    ttlMs: RANKING_CACHE_TTL_MS
  };
}


function buildRankingsAllConfig(incomingUrl, date = new Date()) {
  const allowedParams = new Set([
    "limit",
    "country",
    "type",
    "season"
  ]);

  for (const key of incomingUrl.searchParams.keys()) {
    if (!allowedParams.has(key)) {
      throw new Error("Unsupported query parameter: " + key);
    }
  }

  const limit = incomingUrl.searchParams.get("limit") || RANKING_BUNDLE_LIMIT;
  const country = incomingUrl.searchParams.get("country") || "All countries";
  const requestedType = (incomingUrl.searchParams.get("type") || "official").toLowerCase();
  const type = "official";
  const season = incomingUrl.searchParams.get("season") || String(getCurrentCplSeasonState().season);

  if (!isPositiveInteger(limit) || Number(limit) < 1 || Number(limit) > 100) {
    throw new Error("Invalid limit parameter. Max allowed bundle limit is 100.");
  }

  if (!isPositiveInteger(season)) {
    throw new Error("Invalid season parameter");
  }

  if (requestedType !== "official" && requestedType !== "ladder") {
    throw new Error("Unsupported ranking type. Use official or ladder.");
  }

  const cplDay = new Date(getCplGameDateUtc(date)).toISOString().slice(0, 10);
  const previousCplDay = new Date(getCplGameDateUtc(date) - MS_PER_DAY).toISOString().slice(0, 10);

  const buildSnapshotKey = day => [
    `rankings:players:snapshot:${RANKING_SNAPSHOT_VERSION}`,
    "limit=" + normalizeKeyPart(limit),
    "country=" + normalizeKeyPart(country),
    "type=official",
    "season=" + normalizeKeyPart(season),
    "cpl-day=" + day
  ].join(":");

  const legacyCacheKey = [
    "rankings:players:all:v1",
    "limit=" + normalizeKeyPart(limit),
    "country=" + normalizeKeyPart(country),
    "type=official",
    "season=" + normalizeKeyPart(season)
  ].join(":");

  return {
    limit,
    country,
    type,
    requestedType,
    season,
    cplDay,
    cacheKey: buildSnapshotKey(cplDay),
    previousCacheKey: buildSnapshotKey(previousCplDay),
    legacyCacheKey,
    ttlMs: RANKING_SNAPSHOT_CACHE_TTL_MS
  };
}

function buildRankingPageTargetUrl(config, page) {
  const targetUrl = new URL(CPL_BASE + "/cpl/rankings/players/__data.json");
  targetUrl.searchParams.set("page", String(page));
  targetUrl.searchParams.set("limit", config.limit);
  targetUrl.searchParams.set("country", config.country);
  targetUrl.searchParams.set("type", config.type);
  targetUrl.searchParams.set("season", config.season);
  return targetUrl;
}

function buildRankingPageCacheKey(config, page) {
  return [
    "rankings:players",
    "page=" + normalizeKeyPart(page),
    "limit=" + normalizeKeyPart(config.limit),
    "country=" + normalizeKeyPart(config.country),
    "type=" + normalizeKeyPart(config.type),
    "season=" + normalizeKeyPart(config.season)
  ].join(":");
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function getBerlinDateTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute)
  };
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
    seasonDay
  };
}

function isLadderLiveResultWindow(date = new Date()) {
  const parts = getBerlinDateTimeParts(date);
  return parts.hour === 16;
}

function shouldRefreshDailyLadderCaches(date = new Date()) {
  const parts = getBerlinDateTimeParts(date);
  return parts.hour === LADDER_DAILY_REFRESH_HOUR;
}

function isLeagueLiveResultWindow(date = new Date()) {
  const parts = getBerlinDateTimeParts(date);
  return parts.hour === 20;
}

function shouldRefreshDailyLeagueCaches(date = new Date()) {
  const parts = getBerlinDateTimeParts(date);
  return parts.hour === LEAGUE_DAILY_REFRESH_HOUR;
}

function shouldRefreshDailyRankingCaches(date = new Date()) {
  const parts = getBerlinDateTimeParts(date);
  return parts.hour === RANKING_DAILY_REFRESH_HOUR;
}

function shouldRunDailyTransferWatcher(date = new Date()) {
  const parts = getBerlinDateTimeParts(date);
  return parts.hour === TRANSFER_WATCHER_DAILY_HOUR;
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

async function fetchRankingPagePayload(config, page) {
  const targetUrl = buildRankingPageTargetUrl(config, page);
  let upstreamResponse;

  try {
    upstreamResponse = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
  } catch (error) {
    throw new Error("Ranking page " + page + " upstream fetch failed: " + String(error?.message || error));
  }

  const contentType = upstreamResponse.headers.get("Content-Type") || "application/json; charset=utf-8";
  const bodyText = await upstreamResponse.text();

  if (!upstreamResponse.ok) {
    throw new Error("Ranking page " + page + " failed with HTTP " + upstreamResponse.status);
  }

  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error("Ranking page " + page + " did not return valid JSON");
  }

  return {
    data,
    source: "api"
  };
}

async function fetchRankingBundle(config, options = {}) {
  const { env, allowRefresh = false } = options;
  const cachedEntry = await readKvCache(env, config.cacheKey);

  if (cachedEntry?.body) {
    return cachedResponse(cachedEntry, "HIT", { "X-CPL-Day": config.cplDay });
  }

  if (!allowRefresh) {
    const previousEntry = await readKvCache(env, config.previousCacheKey);
    if (previousEntry?.body) {
      return cachedResponse(previousEntry, "STALE", { "X-CPL-Day": config.cplDay });
    }

    const legacyEntry = await readKvCache(env, config.legacyCacheKey);
    if (legacyEntry?.body) {
      return cachedResponse(legacyEntry, "LEGACY", { "X-CPL-Day": config.cplDay });
    }

    return jsonResponse({ error: "Daily ranking snapshot is not ready yet." }, 503, {
      "Cache-Control": "no-store",
      "Retry-After": "300",
      "X-Cache-Status": "MISS"
    });
  }

  const pages = [];
  const pageSources = [];
  let totalCount = null;
  let totalPages = null;

  try {
    for (let page = 1; page <= RANKING_BUNDLE_MAX_PAGES; page += 1) {
      const result = await fetchRankingPagePayload(config, page);
      const metadata = extractRankingPageMetadata(result.data);

      pages.push(result.data);
      pageSources.push(result.source);

      if (!totalPages && metadata.totalCount) {
        const pageLimit = metadata.limit || Number(config.limit);
        totalCount = metadata.totalCount;
        totalPages = Math.min(RANKING_BUNDLE_MAX_PAGES, Math.ceil(metadata.totalCount / pageLimit));
      }

      if (totalPages && page >= totalPages) {
        break;
      }

      if (!totalPages && !metadata.totalCount) {
        break;
      }
    }
  } catch (error) {
    return jsonResponse(
      {
        error: "Failed to build ranking bundle",
        detail: String(error?.message || error)
      },
      502,
      {
        "X-Cache-Status": "BYPASS"
      }
    );
  }

  if (!pages.length) {
    return jsonResponse(
      {
        error: "Ranking bundle did not contain pages"
      },
      502,
      {
        "X-Cache-Status": "BYPASS"
      }
    );
  }

  const bodyText = JSON.stringify({
    schemaVersion: 1,
    source: "worker-bundle",
    generatedAt: new Date().toISOString(),
    cplDay: config.cplDay,
    season: Number(config.season),
    country: config.country,
    type: config.type,
    limit: Number(config.limit),
    totalCount,
    pageCount: pages.length,
    pageSources,
    pages
  });
  const stored = await writeKvCache(env, config.cacheKey, bodyText, "application/json; charset=utf-8", config.ttlMs);

  return new Response(bodyText, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      "Cache-Control": "public, max-age=300",
      "X-CPL-Day": config.cplDay,
      "X-Cache-Status": stored ? "MISS-STORED" : "MISS-NOT-STORED"
    }
  });
}

async function refreshCurrentRankingBundle(env, date = new Date()) {
  const seasonState = getCurrentCplSeasonState();
  const url = new URL("https://cpl-proxy.local/rankings/players/all");
  url.searchParams.set("limit", RANKING_BUNDLE_LIMIT);
  url.searchParams.set("country", "All countries");
  url.searchParams.set("type", "official");
  url.searchParams.set("season", String(seasonState.season));

  const config = buildRankingsAllConfig(url, date);
  await fetchRankingBundle(config, {
    env,
    allowRefresh: true
  });
}

function buildTransfersTargetUrl(incomingUrl) {
  const allowedParams = new Set([
    "age_range",
    "limit"
  ]);

  for (const key of incomingUrl.searchParams.keys()) {
    if (!allowedParams.has(key)) {
      throw new Error(`Unsupported query parameter: ${key}`);
    }
  }

  const ageRange = incomingUrl.searchParams.get("age_range") || "13-44";
  const limit = incomingUrl.searchParams.get("limit") || "5000";

  if (!/^[0-9]{1,2}-[0-9]{1,2}$/.test(ageRange)) {
    throw new Error("Invalid age_range parameter. Expected format like 13-44.");
  }

  if (!isPositiveInteger(limit) || Number(limit) < 1 || Number(limit) > 5000) {
    throw new Error("Invalid limit parameter. Max allowed limit is 5000.");
  }

  const targetUrl = new URL(`${CPL_BASE}/cpl/api/transfers`);
  targetUrl.searchParams.set("age_range", ageRange);
  targetUrl.searchParams.set("limit", limit);

  const cacheKey = [
    "transfers",
    `age_range=${normalizeKeyPart(ageRange)}`,
    `limit=${normalizeKeyPart(limit)}`
  ].join(":");

  return {
    targetUrl,
    cacheKey,
    ttlMs: TRANSFER_CACHE_TTL_MS
  };
}

function buildCommunityTargetUrl(pathname) {
  const communityMatch = pathname.match(/^\/communities\/([0-9]+)$/);

  if (!communityMatch) {
    throw new Error("Invalid community route. Expected /communities/:communityId");
  }

  const communityId = communityMatch[1];

  return {
    targetUrl: new URL(`${CPL_BASE}/cpl/api/communities/${communityId}`),
    cacheKey: `communities:id=${communityId}`,
    ttlMs: COMMUNITY_CACHE_TTL_MS
  };
}

function buildLadderTargetUrl(pathname) {
  const ladderMatch = pathname.match(/^\/ladders\/([0-9]+)$/);

  if (!ladderMatch) {
    throw new Error("Invalid ladder route. Expected /ladders/:ladderId");
  }

  const ladderId = ladderMatch[1];

  return {
    targetUrl: new URL(`${CPL_BASE}/cpl/api/ladders/${ladderId}`),
    cacheKey: `ladders:id=${ladderId}`,
    ttlMs: LADDER_CACHE_TTL_MS
  };
}

function buildLadderMatchesConfig(incomingUrl) {
  const ladderMatch = incomingUrl.pathname.match(/^\/ladders\/([0-9]+)\/matches$/);

  if (!ladderMatch) {
    throw new Error("Invalid ladder matches route. Expected /ladders/:ladderId/matches");
  }

  const allowedParams = new Set(["limit", "refresh", "teamIds"]);
  for (const key of incomingUrl.searchParams.keys()) {
    if (!allowedParams.has(key)) {
      throw new Error(`Unsupported query parameter: ${key}`);
    }
  }

  const ladderId = ladderMatch[1];
  const requestedLimit = incomingUrl.searchParams.get("limit") || LADDER_MATCHES_LIMIT;

  if (!isPositiveInteger(requestedLimit)) {
    throw new Error("limit must be a positive integer");
  }

  const requestedTeamIds = incomingUrl.searchParams.get("teamIds") || "";
  const teamIds = Array.from(new Set(
    requestedTeamIds
      .split(",")
      .map(teamId => teamId.trim())
      .filter(Boolean)
  ));

  for (const teamId of teamIds) {
    if (!isPositiveInteger(teamId)) {
      throw new Error("teamIds must contain positive integers");
    }
  }

  const limit = String(Math.max(1, Math.min(Number(requestedLimit), Number(LADDER_MATCHES_LIMIT))));

  return {
    ladderId,
    limit,
    teamIds,
    cacheKey: `ladders:matches:id=${ladderId}:limit=${limit}`
  };
}

function buildLadderMatchesPageTargetUrl(config, page) {
  const targetUrl = new URL(`${CPL_BASE}/cpl/api/ladders/${config.ladderId}/matches`);
  targetUrl.searchParams.set("page", String(page));
  targetUrl.searchParams.set("limit", config.limit);
  return targetUrl;
}

function buildLadderMatchesPageCacheKey(config, page) {
  return `${config.cacheKey}:page=${page}`;
}

function isLadderMatchLike(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value.id || value.matchId) &&
    (value.homeTeamId || value.homeTeam?.id || value.team1Id) &&
    (value.awayTeamId || value.awayTeam?.id || value.team2Id)
  );
}

function getLadderMatchesArray(rawData) {
  if (Array.isArray(rawData)) return rawData;

  const direct = rawData?.matches || rawData?.data || rawData?.items || rawData?.results;
  if (Array.isArray(direct)) return direct;

  const visited = new WeakSet();

  function visit(value) {
    if (!value || typeof value !== "object" || visited.has(value)) return null;
    visited.add(value);

    if (Array.isArray(value)) {
      if (value.some(isLadderMatchLike)) return value;

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

  return visit(rawData) || [];
}

function getLadderMatchesTotalCount(rawData) {
  const candidates = [
    rawData?.totalCount,
    rawData?.total_count,
    rawData?.total,
    rawData?.count,
    rawData?.meta?.totalCount,
    rawData?.meta?.total,
    rawData?.pagination?.totalCount,
    rawData?.pagination?.total
  ];

  for (const candidate of candidates) {
    const number = Number(candidate);
    if (Number.isFinite(number) && number > 0) return number;
  }

  return null;
}

function getLadderMatchDedupeKey(match) {
  const id = match?.id ?? match?.matchId;
  if (id !== undefined && id !== null) return `id:${id}`;

  return [
    match?.date || match?.startsAt || "",
    match?.homeTeamId || match?.homeTeam?.id || match?.team1Id || "",
    match?.awayTeamId || match?.awayTeam?.id || match?.team2Id || ""
  ].join(":");
}

function getLadderMatchTeamId(match, side) {
  if (side === "home") {
    return match?.homeTeamId ?? match?.homeTeam?.id ?? match?.team1Id ?? match?.teamOneId ?? null;
  }

  return match?.awayTeamId ?? match?.awayTeam?.id ?? match?.team2Id ?? match?.teamTwoId ?? null;
}

function filterLadderMatchesPayload(payload, teamIds = []) {
  const matches = Array.isArray(payload?.matches) ? payload.matches : [];
  const totalMatchCount = Number(payload?.totalMatchCount ?? payload?.matchCount ?? matches.length) || matches.length;

  if (!teamIds.length) {
    return {
      ...payload,
      totalMatchCount,
      matchCount: matches.length,
      matches
    };
  }

  const teamIdSet = new Set(teamIds.map(teamId => String(teamId)));
  const filteredMatches = matches.filter(match => {
    const homeTeamId = getLadderMatchTeamId(match, "home");
    const awayTeamId = getLadderMatchTeamId(match, "away");
    return teamIdSet.has(String(homeTeamId)) || teamIdSet.has(String(awayTeamId));
  });

  return {
    ...payload,
    teamIds: teamIds.map(teamId => Number(teamId)),
    totalMatchCount,
    matchCount: filteredMatches.length,
    matches: filteredMatches
  };
}

function getLadderMatchesResponseHeaders(payload, liveWindow, extraHeaders = {}) {
  return {
    "X-Live-Window": liveWindow ? "true" : "false",
    "X-Ladder-Pages": String(payload?.pageCount || 0),
    "X-Ladder-Matches": String(payload?.matchCount || 0),
    "X-Ladder-Total-Matches": String(payload?.totalMatchCount || payload?.matchCount || 0),
    ...extraHeaders
  };
}

function ladderMatchesCachedResponse(payload, cacheStatus, cachedAt, liveWindow, extraHeaders = {}) {
  return cachedResponse({
    body: JSON.stringify(payload),
    contentType: "application/json; charset=utf-8",
    cachedAt
  }, cacheStatus, getLadderMatchesResponseHeaders(payload, liveWindow, extraHeaders));
}

async function fetchLadderMatchesPagePayload(env, config, page, ttlMs, forceRefresh) {
  const cacheKey = buildLadderMatchesPageCacheKey(config, page);

  if (!forceRefresh) {
    const cachedEntry = await readKvCache(env, cacheKey);
    if (isCacheEntryFresh(cachedEntry, ttlMs)) {
      return { data: JSON.parse(cachedEntry.body), source: "page-cache" };
    }
  }

  const targetUrl = buildLadderMatchesPageTargetUrl(config, page);
  const upstreamResponse = await fetch(targetUrl.toString(), {
    method: "GET",
    headers: { "Accept": "application/json, text/plain, */*" }
  });

  if (!upstreamResponse.ok) {
    throw new Error(`Ladder matches page ${page} failed with HTTP ${upstreamResponse.status}`);
  }

  const bodyText = await upstreamResponse.text();
  const contentType = upstreamResponse.headers.get("Content-Type") || "application/json; charset=utf-8";
  await writeKvCache(env, cacheKey, bodyText, contentType, ttlMs);

  return { data: JSON.parse(bodyText), source: "api" };
}

async function fetchLadderMatchesBundle(env, config, options = {}) {
  const { ttlMs = LADDER_MATCHES_CACHE_TTL_MS, forceRefresh = false, liveWindow = false } = options;

  if (!forceRefresh) {
    const cachedEntry = await readKvCache(env, config.cacheKey);
    if (isCacheEntryFresh(cachedEntry, ttlMs)) {
      const cachedPayload = filterLadderMatchesPayload(JSON.parse(cachedEntry.body), config.teamIds);
      return ladderMatchesCachedResponse(cachedPayload, "HIT", cachedEntry.cachedAt, liveWindow);
    }
  }

  const matches = [];
  const seen = new Set();
  const pageSources = [];
  let page = 1;
  let totalPages = null;
  let pagesLoaded = 0;

  while (page <= LADDER_MATCHES_MAX_PAGES) {
    const pageResult = await fetchLadderMatchesPagePayload(env, config, page, ttlMs, forceRefresh || liveWindow);
    const pageMatches = getLadderMatchesArray(pageResult.data);
    pageSources.push(pageResult.source);
    pagesLoaded = page;

    pageMatches.forEach(match => {
      const key = getLadderMatchDedupeKey(match);
      if (seen.has(key)) return;
      seen.add(key);
      matches.push(match);
    });

    if (!totalPages) {
      const totalCount = getLadderMatchesTotalCount(pageResult.data);
      if (totalCount) {
        totalPages = Math.min(LADDER_MATCHES_MAX_PAGES, Math.ceil(totalCount / Number(config.limit)));
      }
    }

    if (totalPages && page >= totalPages) break;
    if (!totalPages && pageMatches.length > Number(config.limit)) break;
    if (!totalPages && pageMatches.length < Number(config.limit)) break;
    if (!pageMatches.length) break;

    page += 1;
  }

  const payload = {
    ladderId: Number(config.ladderId),
    limit: Number(config.limit),
    pageCount: pagesLoaded,
    totalMatchCount: matches.length,
    matchCount: matches.length,
    liveWindow,
    source: pageSources.includes("api") ? "api" : "cache",
    generatedAt: new Date().toISOString(),
    matches
  };
  const bodyText = JSON.stringify(payload);
  const stored = await writeKvCache(env, config.cacheKey, bodyText, "application/json; charset=utf-8", ttlMs);
  const responsePayload = filterLadderMatchesPayload(payload, config.teamIds);

  return ladderMatchesCachedResponse(
    responsePayload,
    stored ? "MISS-STORED" : "MISS",
    Date.now(),
    liveWindow
  );
}

function buildLeagueTargetUrl(pathname) {
    const leagueMatch = pathname.match(/^\/leagues\/([0-9]+)$/);

    if (!leagueMatch) {
      throw new Error("Invalid league route. Expected /leagues/:leagueId");
    }

    const leagueId = leagueMatch[1];

    return {
      targetUrl: new URL(`${CPL_BASE}/cpl/api/leagues/${leagueId}`),
      cacheKey: `leagues:id=${leagueId}`,
      ttlMs: LEAGUE_CACHE_TTL_MS
    };
  }

function buildLeagueTeamsTargetUrl(pathname) {
    const leagueMatch = pathname.match(/^\/leagues\/([0-9]+)\/teams$/);

    if (!leagueMatch) {
      throw new Error("Invalid league teams route. Expected /leagues/:leagueId/teams");
    }

    const leagueId = leagueMatch[1];

    return {
      targetUrl: new URL(`${CPL_BASE}/cpl/api/leagues/${leagueId}/teams`),
      cacheKey: `leagues:teams:id=${leagueId}`,
      ttlMs: LEAGUE_CACHE_TTL_MS
    };
  }

function buildLeagueMatchesConfig(incomingUrl) {
    const leagueMatch = incomingUrl.pathname.match(/^\/leagues\/([0-9]+)\/matches$/);

    if (!leagueMatch) {
      throw new Error("Invalid league matches route. Expected /leagues/:leagueId/matches");
    }

    const allowedParams = new Set(["limit", "refresh", "teamIds"]);
    for (const key of incomingUrl.searchParams.keys()) {
      if (!allowedParams.has(key)) {
        throw new Error(`Unsupported query parameter: ${key}`);
      }
    }

    const leagueId = leagueMatch[1];
    const requestedLimit = incomingUrl.searchParams.get("limit") || LEAGUE_MATCHES_LIMIT;

    if (!isPositiveInteger(requestedLimit)) {
      throw new Error("limit must be a positive integer");
    }

    const requestedTeamIds = incomingUrl.searchParams.get("teamIds") || "";
    const teamIds = Array.from(new Set(
      requestedTeamIds
        .split(",")
        .map(teamId => teamId.trim())
        .filter(Boolean)
    ));

    for (const teamId of teamIds) {
      if (!isPositiveInteger(teamId)) {
        throw new Error("teamIds must contain positive integers");
      }
    }

    const limit = String(Math.max(1, Math.min(Number(requestedLimit), Number(LEAGUE_MATCHES_LIMIT))));

    return {
      leagueId,
      limit,
      teamIds,
      cacheKey: `leagues:matches:id=${leagueId}:limit=${limit}`
    };
  }

function buildLeagueMatchesPageTargetUrl(config, page) {
    const targetUrl = new URL(`${CPL_BASE}/cpl/api/leagues/${config.leagueId}/matches`);
    targetUrl.searchParams.set("page", String(page));
    targetUrl.searchParams.set("limit", config.limit);
    return targetUrl;
  }

function buildLeagueMatchesPageCacheKey(config, page) {
    return `${config.cacheKey}:page=${page}`;
  }

function getLeagueMatchesResponseHeaders(payload, liveWindow, extraHeaders = {}) {
    return {
      "X-Live-Window": liveWindow ? "true" : "false",
      "X-League-Pages": String(payload?.pageCount || 0),
      "X-League-Matches": String(payload?.matchCount || 0),
      "X-League-Total-Matches": String(payload?.totalMatchCount || payload?.matchCount || 0),
      ...extraHeaders
    };
  }

function leagueMatchesCachedResponse(payload, cacheStatus, cachedAt, liveWindow, extraHeaders = {}) {
    return cachedResponse({
      body: JSON.stringify(payload),
      contentType: "application/json; charset=utf-8",
      cachedAt
    }, cacheStatus, getLeagueMatchesResponseHeaders(payload, liveWindow, extraHeaders));
  }

async function fetchLeagueMatchesPagePayload(env, config, page, ttlMs, forceRefresh) {
    const cacheKey = buildLeagueMatchesPageCacheKey(config, page);

    if (!forceRefresh) {
      const cachedEntry = await readKvCache(env, cacheKey);
      if (isCacheEntryFresh(cachedEntry, ttlMs)) {
        return { data: JSON.parse(cachedEntry.body), source: "page-cache" };
      }
    }

    const targetUrl = buildLeagueMatchesPageTargetUrl(config, page);
    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: { "Accept": "application/json, text/plain, */*" }
    });

    if (!upstreamResponse.ok) {
      throw new Error(`League matches page ${page} failed with HTTP ${upstreamResponse.status}`);
    }

    const bodyText = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get("Content-Type") || "application/json; charset=utf-8";
    await writeKvCache(env, cacheKey, bodyText, contentType, ttlMs);

    return { data: JSON.parse(bodyText), source: "api" };
  }

async function fetchLeagueMatchesBundle(env, config, options = {}) {
    const { ttlMs = LEAGUE_MATCHES_CACHE_TTL_MS, forceRefresh = false, liveWindow = false } = options;

    if (!forceRefresh) {
      const cachedEntry = await readKvCache(env, config.cacheKey);
      if (isCacheEntryFresh(cachedEntry, ttlMs)) {
        const cachedPayload = filterLadderMatchesPayload(JSON.parse(cachedEntry.body), config.teamIds);
        return leagueMatchesCachedResponse(cachedPayload, "HIT", cachedEntry.cachedAt, liveWindow);
      }
    }

    const matches = [];
    const seen = new Set();
    const pageSources = [];
    let page = 1;
    let totalPages = null;
    let pagesLoaded = 0;

    while (page <= LEAGUE_MATCHES_MAX_PAGES) {
      const pageResult = await fetchLeagueMatchesPagePayload(env, config, page, ttlMs, forceRefresh || liveWindow);
      const pageMatches = getLadderMatchesArray(pageResult.data);
      pageSources.push(pageResult.source);
      pagesLoaded = page;

      pageMatches.forEach(match => {
        const key = getLadderMatchDedupeKey(match);
        if (seen.has(key)) return;
        seen.add(key);
        matches.push(match);
      });

      if (!totalPages) {
        const totalCount = getLadderMatchesTotalCount(pageResult.data);
        if (totalCount) {
          totalPages = Math.min(LEAGUE_MATCHES_MAX_PAGES, Math.ceil(totalCount / Number(config.limit)));
        }
      }

      if (totalPages && page >= totalPages) break;
      if (!totalPages && pageMatches.length > Number(config.limit)) break;
      if (!totalPages && pageMatches.length < Number(config.limit)) break;
      if (!pageMatches.length) break;

      page += 1;
    }

    const payload = {
      leagueId: Number(config.leagueId),
      limit: Number(config.limit),
      pageCount: pagesLoaded,
      totalMatchCount: matches.length,
      matchCount: matches.length,
      liveWindow,
      source: pageSources.includes("api") ? "api" : "cache",
      generatedAt: new Date().toISOString(),
      matches
    };
    const bodyText = JSON.stringify(payload);
    const stored = await writeKvCache(env, config.cacheKey, bodyText, "application/json; charset=utf-8", ttlMs);
    const responsePayload = filterLadderMatchesPayload(payload, config.teamIds);

    return leagueMatchesCachedResponse(
      responsePayload,
      stored ? "MISS-STORED" : "MISS",
      Date.now(),
      liveWindow
    );
  }

function buildChampionshipConfig(pathname) {
  const championshipMatch = pathname.match(/^\/championships\/([0-9]+)\/__data\.json$/);

  if (!championshipMatch) {
    throw new Error("Invalid championship route. Expected /championships/:season/__data.json");
  }

  const season = championshipMatch[1];

  return {
    season,
    cacheKey: `championships:season=${season}:v2`,
    ttlMs: TOURNAMENT_CACHE_TTL_MS
  };
}

function sanitizeChampionshipTournament(tournament) {
  return {
    id: Number(tournament.id ?? tournament.tournamentId),
    name: String(tournament.name || ""),
    season: Number(tournament.season),
    type: String(tournament.type || "").toLowerCase(),
    tier: tournament.tier ?? null,
    status: String(tournament.status || ""),
    sponsor: String(tournament.sponsor || ""),
    logoUrl: String(tournament.logoUrl || "")
  };
}

async function fetchChampionshipTournaments(env, config, forceRefresh = false) {
  const cachedEntry = !forceRefresh ? await readKvCache(env, config.cacheKey) : null;

  if (isCacheEntryFresh(cachedEntry, config.ttlMs)) {
    return cachedResponse(cachedEntry, "HIT");
  }

  let upstreamResponse;

  try {
    upstreamResponse = await fetch(`${CPL_BASE}/cpl/api/tournaments`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
  } catch (error) {
    if (cachedEntry?.body) {
      return cachedResponse(cachedEntry, "STALE");
    }

    return jsonResponse({
      error: "Failed to load championship tournament list",
      detail: String(error?.message || error)
    }, 502, {
      "X-Cache-Status": "BYPASS"
    });
  }

  if (!upstreamResponse.ok) {
    if (cachedEntry?.body) {
      return cachedResponse(cachedEntry, "STALE");
    }

    return jsonResponse({
      error: "Championship tournament upstream returned an error",
      upstreamStatus: upstreamResponse.status
    }, 502, {
      "X-Cache-Status": "BYPASS"
    });
  }

  let rawTournaments;

  try {
    rawTournaments = await upstreamResponse.json();
  } catch {
    if (cachedEntry?.body) {
      return cachedResponse(cachedEntry, "STALE");
    }

    return jsonResponse({
      error: "Championship tournament upstream did not return valid JSON"
    }, 502, {
      "X-Cache-Status": "BYPASS"
    });
  }

  if (!Array.isArray(rawTournaments)) {
    if (cachedEntry?.body) {
      return cachedResponse(cachedEntry, "STALE");
    }

    return jsonResponse({
      error: "Championship tournament upstream returned an unexpected payload"
    }, 502, {
      "X-Cache-Status": "BYPASS"
    });
  }

  const tournaments = rawTournaments
    .filter(tournament => (
      Number(tournament?.season) === Number(config.season) &&
      CHAMPIONSHIP_TYPES.has(String(tournament?.type || "").toLowerCase())
    ))
    .map(sanitizeChampionshipTournament)
    .filter(tournament => Number.isFinite(tournament.id) && tournament.name)
    .sort((a, b) => {
      const order = { challengers: 0, contenders: 1, championship: 2 };
      return (order[a.type] ?? 99) - (order[b.type] ?? 99);
    });

  if (!tournaments.length) {
    if (cachedEntry?.body) {
      return cachedResponse(cachedEntry, "STALE");
    }

    return jsonResponse({
      error: "No championship tournaments found",
      season: Number(config.season)
    }, 404, {
      "X-Cache-Status": "BYPASS"
    });
  }

  const payload = {
    schemaVersion: 1,
    source: "worker-filtered",
    generatedAt: new Date().toISOString(),
    season: Number(config.season),
    tournaments
  };
  const bodyText = JSON.stringify(payload);
  const stored = await writeKvCache(
    env,
    config.cacheKey,
    bodyText,
    "application/json; charset=utf-8",
    config.ttlMs
  );

  return new Response(bodyText, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      "Cache-Control": "public, max-age=300",
      "X-Cache-Status": stored ? "MISS-STORED" : "MISS-NOT-STORED",
      "X-Tournament-Count": String(tournaments.length)
    }
  });
}

function buildOfficialTournamentsTargetUrl(pathname) {
  if (pathname !== "/tournaments/official/__data.json") {
    throw new Error("Invalid official tournaments route. Expected /tournaments/official/__data.json");
  }

  return {
    targetUrl: new URL(`${CPL_BASE}/cpl/tournaments/official/__data.json`),
    cacheKey: "tournaments:official",
    ttlMs: TOURNAMENT_CACHE_TTL_MS
  };
}

function buildTournamentDetailTargetUrl(pathname) {
  const tournamentMatch = pathname.match(/^\/api\/tournaments\/([0-9]+)$/);

  if (!tournamentMatch) {
    throw new Error("Invalid tournament route. Expected /api/tournaments/:tournamentId");
  }

  const tournamentId = tournamentMatch[1];

  return {
    targetUrl: new URL(`${CPL_BASE}/cpl/api/tournaments/${tournamentId}`),
    cacheKey: `tournaments:id=${tournamentId}`,
    ttlMs: TOURNAMENT_CACHE_TTL_MS
  };
}

function buildPlayerTargetUrl(pathname) {
  const playerMatch = pathname.match(/^\/players\/([0-9]+)$/);

  if (playerMatch) {
    const playerId = playerMatch[1];
    return new URL(`${CPL_BASE}/cpl/api/players/${playerId}`);
  }

  const playerStatsMatch = pathname.match(/^\/players\/([0-9]+)\/stats$/);

  if (playerStatsMatch) {
    const playerId = playerStatsMatch[1];
    return new URL(`${CPL_BASE}/cpl/api/players/${playerId}/stats`);
  }

  throw new Error("Invalid player route. Expected /players/:playerId or /players/:playerId/stats");
}

function isCacheEntryFresh(entry, ttlMs) {
  if (!entry || typeof entry.cachedAt !== "number") {
    return false;
  }

  return Date.now() - entry.cachedAt < ttlMs;
}

async function readKvCache(env, cacheKey) {
  if (!env?.CPL_CACHE || !cacheKey) {
    return null;
  }

  try {
    return await env.CPL_CACHE.get(cacheKey, "json");
  } catch (error) {
    console.warn("KV cache read failed:", cacheKey, error);
    return null;
  }
}

async function writeKvCache(env, cacheKey, bodyText, contentType, ttlMs) {
  if (!env?.CPL_CACHE || !cacheKey) {
    return false;
  }

  const cacheEntry = {
    cachedAt: Date.now(),
    contentType: contentType || "application/json; charset=utf-8",
    body: bodyText
  };

  try {
    await env.CPL_CACHE.put(cacheKey, JSON.stringify(cacheEntry), {
      expirationTtl: Math.ceil((ttlMs * 2) / 1000)
    });

    return true;
  } catch (error) {
    console.warn("KV cache write failed:", cacheKey, error);
    return false;
  }
}

function cachedResponse(entry, cacheStatus, extraHeaders = {}) {
  return new Response(entry.body, {
    status: 200,
    headers: {
      "Content-Type": entry.contentType || "application/json; charset=utf-8",
      ...corsHeaders,
      "Cache-Control": "public, max-age=300",
      "X-Cache-Status": cacheStatus,
      "X-Cached-At": new Date(entry.cachedAt).toISOString(),
      ...extraHeaders
    }
  });
}

async function proxyToCpl(targetUrl, options = {}) {
  const {
    env,
    cacheKey,
    ttlMs = 0,
    useKvCache = false,
    forceRefresh = false
  } = options;

  let cachedEntry = null;

  if (useKvCache && cacheKey && !forceRefresh) {
    cachedEntry = await readKvCache(env, cacheKey);

    if (isCacheEntryFresh(cachedEntry, ttlMs)) {
      return cachedResponse(cachedEntry, "HIT");
    }
  }

  let upstreamResponse;

  try {
    upstreamResponse = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
  } catch (error) {
    if (cachedEntry?.body) {
      return cachedResponse(cachedEntry, "STALE");
    }

    return jsonResponse(
      {
        error: "Failed to reach CPL upstream",
        detail: String(error?.message || error)
      },
      502,
      {
        "X-Cache-Status": "BYPASS"
      }
    );
  }

  const contentType = upstreamResponse.headers.get("Content-Type") || "application/json; charset=utf-8";
  const bodyText = await upstreamResponse.text();

  if (!upstreamResponse.ok) {
    if (cachedEntry?.body) {
      return cachedResponse(cachedEntry, "STALE");
    }

    return jsonResponse(
      {
        error: "CPL upstream returned an error",
        upstreamStatus: upstreamResponse.status,
        upstreamStatusText: upstreamResponse.statusText
      },
      upstreamResponse.status >= 400 && upstreamResponse.status < 600
        ? upstreamResponse.status
        : 502,
      {
        "X-Cache-Status": "BYPASS"
      }
    );
  }

  try {
    JSON.parse(bodyText);
  } catch {
    if (cachedEntry?.body) {
      return cachedResponse(cachedEntry, "STALE");
    }

    return jsonResponse(
      {
        error: "CPL upstream did not return valid JSON"
      },
      502,
      {
        "X-Cache-Status": "BYPASS"
      }
    );
  }

  let cacheStatus = "BYPASS";

  if (useKvCache && cacheKey && ttlMs > 0) {
    const stored = await writeKvCache(env, cacheKey, bodyText, contentType, ttlMs);
    cacheStatus = stored ? "MISS-STORED" : "MISS-NOT-STORED";
  }

  return new Response(bodyText, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      "Cache-Control": "public, max-age=300",
      "X-Cache-Status": cacheStatus
    }
  });
}
function unwrapTransferPlayer(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  return (
    entry.player ||
    entry.transferPlayer ||
    entry.playerData ||
    entry.cplPlayer ||
    entry
  );
}

function looksLikePlayer(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  const hasId = obj.id !== undefined || obj.playerId !== undefined;
  const hasPlayerName = obj.name !== undefined || obj.nick !== undefined;
  const hasLimits =
    obj.totalLimit !== undefined ||
    obj.aimSkillLimit !== undefined ||
    obj.quicknessSkillLimit !== undefined;

  return hasId && hasPlayerName && hasLimits;
}

function extractTransferPlayers(rawData) {
  if (!rawData) {
    return [];
  }

  const directCandidates = [];

  if (Array.isArray(rawData)) {
    directCandidates.push(...rawData);
  } else if (typeof rawData === "object") {
    for (const key of ["players", "transfers", "items", "results", "data"]) {
      if (Array.isArray(rawData[key])) {
        directCandidates.push(...rawData[key]);
      }
    }
  }

  const players = directCandidates
    .map(unwrapTransferPlayer)
    .filter(looksLikePlayer);

  if (players.length > 0) {
    return dedupePlayersById(players);
  }

  // Fallback: defensive recursive search
  const found = [];
  const seen = new Set();

  function walk(value, depth = 0) {
    if (!value || typeof value !== "object" || depth > 5) {
      return;
    }

    if (seen.has(value)) {
      return;
    }

    seen.add(value);

    const unwrapped = unwrapTransferPlayer(value);

    if (looksLikePlayer(unwrapped)) {
      found.push(unwrapped);
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item, depth + 1);
      }
      return;
    }

    for (const child of Object.values(value)) {
      walk(child, depth + 1);
    }
  }

  walk(rawData);

  return dedupePlayersById(found);
}

function dedupePlayersById(players) {
  const map = new Map();

  for (const player of players) {
    const id = getPlayerId(player);

    if (id !== null) {
      map.set(String(id), player);
    }
  }

  return [...map.values()];
}

function getPlayerId(player) {
  const id = player?.id ?? player?.playerId;

  if (id === undefined || id === null) {
    return null;
  }

  const numericId = Number(id);

  return Number.isFinite(numericId) ? numericId : null;
}

function getPlayerAge(player) {
  const age = Number(player?.age);

  return Number.isFinite(age) ? age : null;
}

function getPlayerTeamId(player) {
  if (player?.teamId === null || player?.teamId === undefined) {
    return null;
  }

  const teamId = Number(player.teamId);

  return Number.isFinite(teamId) ? teamId : null;
}

function getTotalLimit(player) {
  const totalLimit = Number(player?.totalLimit);

  return Number.isFinite(totalLimit) ? totalLimit : 0;
}

function getSkillLimit(player, skill) {
  const directField = `${skill}SkillLimit`;

  const value =
    player?.[directField] ??
    player?.skills?.[skill]?.limit ??
    player?.skillLimits?.[skill];

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}
function getFame(player) {
  const value =
    player?.fame;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function getFameProgress(player) {
  const value =
    player?.fameProgress;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function matchesFameRule(player, fameRule) {
  if (!fameRule) {
    return true;
  }

  const fame = getFame(player);
  const fameProgress = getFameProgress(player);

  const matchesFame3Progress =
    fame === 3 &&
    fameProgress !== null &&
    fameProgress > fameRule.fame3ProgressAbove;

  const matchesFameAtLeast =
    fame !== null &&
    fame >= fameRule.fameAtLeast;

  return matchesFame3Progress || matchesFameAtLeast;
}

function normalizeAbilityName(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getPlayerAbilityNames(player) {
  const names = [];

  for (const item of player?.specials || []) {
    if (item?.name) {
      names.push(item.name);
    }
  }

  return names;
}

function hasAnyRequiredSpecial(player, requiredSpecialsAny) {
  if (!requiredSpecialsAny || requiredSpecialsAny.length === 0) {
    return true;
  }

  const normalizedNames = getPlayerAbilityNames(player).map(normalizeAbilityName);

  return requiredSpecialsAny.some((required) =>
    normalizedNames.includes(normalizeAbilityName(required))
  );
}

function getMatchedSpecials(player) {
  const wanted = [
    "entertaining",
    "fire-heart",
    "fragger",
    "tryhard",
    "loyal",
    "long-lived"
  ];

  const normalizedNames = getPlayerAbilityNames(player).map(normalizeAbilityName);

  return wanted.filter((name) =>
    normalizedNames.includes(normalizeAbilityName(name))
  );
}

function matchesTransferRule(player, rule) {
  const age = getPlayerAge(player);

  if (age !== null) {
    if (rule.minAge !== undefined && age < rule.minAge) {
      return false;
    }

    if (rule.maxAge !== undefined && age > rule.maxAge) {
      return false;
    }
  }

  if (!hasAnyRequiredSpecial(player, rule.requiredSpecialsAny)) {
    return false;
  }

  if (!matchesFameRule(player, rule.fameRule)) {
    return false;
  }

  if (rule.minTotalLimit !== undefined && getTotalLimit(player) < rule.minTotalLimit) {
    return false;
  }

  for (const [skill, minLimit] of Object.entries(rule.minSkillLimits || {})) {
    if (getSkillLimit(player, skill) < minLimit) {
      return false;
    }
  }

  for (const [skill, minLimit] of Object.entries(rule.minSkillLimitsAbove || {})) {
    if (getSkillLimit(player, skill) <= minLimit) {
      return false;
    }
  }

  if (rule.skillLimitSumAbove) {
    const skills = Array.isArray(rule.skillLimitSumAbove.skills) ? rule.skillLimitSumAbove.skills : [];
    const minSum = Number(rule.skillLimitSumAbove.value);
    const sum = skills.reduce((total, skill) => total + getSkillLimit(player, skill), 0);

    if (!Number.isFinite(minSum) || sum <= minSum) {
      return false;
    }
  }

  return true;
}

function getCplPlayerUrl(player) {
  const playerId = getPlayerId(player);
  const teamId = getPlayerTeamId(player);

  if (teamId === null) {
    return `https://www.cplmanager.com/cpl/teams/free-agent/players/${playerId}`;
  }

  return `https://www.cplmanager.com/cpl/teams/${teamId}/players/${playerId}`;
}

function buildDiscordPlayerLine(match) {
  const { player, rule } = match;

  const playerId = getPlayerId(player);
  const age = getPlayerAge(player);
  const teamId = getPlayerTeamId(player);
  const specials = getMatchedSpecials(player);

  const name = player.name || "Unknown";
  const nick = player.nick ? ` "${player.nick}"` : "";
  const totalSkill = player.totalSkill ?? "?";
  const totalLimit = player.totalLimit ?? "?";

  const teamText = teamId === null ? "Free Agent" : `Team ${teamId}`;
  const specialText = specials.length > 0 ? ` | ${specials.join(", ")}` : "";
  const url = getCplPlayerUrl(player);

  return [
    `**${name}${nick}**`,
    `Age: ${age ?? "?"}`,
    `Total: ${totalSkill}/${totalLimit}`,
    `Status: ${teamText}`,
    `Rule: ${rule.label}`,
    `${url}${specialText}`
  ].join(" | ");
}

function buildDiscordTransferMessage(matches) {
  const lines = matches.map(buildDiscordPlayerLine);

  return [
    "🔎 **CPL Transfer Watcher**",
    `Found ${matches.length} matching transfer-list player${matches.length === 1 ? "" : "s"}:`,
    "",
    ...lines.map((line, index) => `${index + 1}. ${line}`)
  ].join("\n");
}

async function hasAlreadyReported(env, playerId, ruleId) {
  const key = `discord:reported:${ruleId}:${playerId}`;

  try {
    const existing = await env.CPL_CACHE.get(key);
    return Boolean(existing);
  } catch (error) {
    console.warn("Failed to read reported marker:", key, error);
    return false;
  }
}

async function markReported(env, playerId, ruleId) {
  const key = `discord:reported:${ruleId}:${playerId}`;

  try {
    await env.CPL_CACHE.put(
      key,
      JSON.stringify({
        playerId,
        ruleId,
        reportedAt: new Date().toISOString()
      }),
      {
        expirationTtl: DISCORD_REPORTED_TTL_SECONDS
      }
    );
  } catch (error) {
    console.warn("Failed to write reported marker:", key, error);
  }
}

async function sendDiscordMessage(env, content) {
  if (!env.DISCORD_WEBHOOK_URL) {
    console.warn("DISCORD_WEBHOOK_URL secret is missing.");
    return false;
  }

  const response = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content,
      allowed_mentions: {
        parse: []
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();

    console.warn("Discord webhook failed:", response.status, errorText);

    return false;
  }

  return true;
}

async function loadTransferDataForWatcher(env) {
  let cacheEntry = await readKvCache(env, TRANSFER_CACHE_KEY);

  if (cacheEntry?.body) {
    return JSON.parse(cacheEntry.body);
  }

  const transferUrl = new URL(`${CPL_BASE}/cpl/api/transfers`);
  transferUrl.searchParams.set("age_range", "13-44");
  transferUrl.searchParams.set("limit", "5000");

  await proxyToCpl(transferUrl, {
    env,
    useKvCache: true,
    forceRefresh: true,
    cacheKey: TRANSFER_CACHE_KEY,
    ttlMs: TRANSFER_CACHE_TTL_MS
  });

  cacheEntry = await readKvCache(env, TRANSFER_CACHE_KEY);

  if (!cacheEntry?.body) {
    throw new Error("Transfer cache is empty after refresh.");
  }

  return JSON.parse(cacheEntry.body);
}

async function runTransferWatcher(env) {
  if (!env?.CPL_CACHE) {
    console.warn("CPL_CACHE binding is missing. Transfer watcher skipped.");
    return;
  }

  const rawTransferData = await loadTransferDataForWatcher(env);
  const players = extractTransferPlayers(rawTransferData);

  console.log(`Transfer watcher found ${players.length} transfer players.`);

  const matches = [];

  for (const rule of TRANSFER_ALERT_RULES) {
    for (const player of players) {
      const playerId = getPlayerId(player);

      if (playerId === null) {
        continue;
      }

      if (!matchesTransferRule(player, rule)) {
        continue;
      }

      const alreadyReported = await hasAlreadyReported(env, playerId, rule.id);

      if (alreadyReported) {
        continue;
      }

      matches.push({
        player,
        rule
      });

      if (matches.length >= MAX_DISCORD_ALERT_PLAYERS) {
        break;
      }
    }

    if (matches.length >= MAX_DISCORD_ALERT_PLAYERS) {
      break;
    }
  }

  if (matches.length === 0) {
    console.log("Transfer watcher found no new matches.");
    return;
  }

  const message = buildDiscordTransferMessage(matches);
  const sent = await sendDiscordMessage(env, message);

  if (!sent) {
    return;
  }

  for (const match of matches) {
    await markReported(env, getPlayerId(match.player), match.rule.id);
  }

  console.log(`Transfer watcher posted ${matches.length} Discord alert(s).`);
}

async function refreshCurrentLadderCaches(env) {
  const seasonState = getCurrentCplSeasonState();
  const ladderId = String(seasonState.season + 36);
  const ladderRoute = buildLadderTargetUrl(`/ladders/${ladderId}`);

  await proxyToCpl(ladderRoute.targetUrl, {
    env,
    useKvCache: true,
    forceRefresh: true,
    cacheKey: ladderRoute.cacheKey,
    ttlMs: ladderRoute.ttlMs
  });

  await fetchLadderMatchesBundle(env, {
    ladderId,
    limit: LADDER_MATCHES_LIMIT,
    cacheKey: `ladders:matches:id=${ladderId}:limit=${LADDER_MATCHES_LIMIT}`
  }, {
    ttlMs: LADDER_MATCHES_CACHE_TTL_MS,
    forceRefresh: true,
    liveWindow: false
  });
}

function getCommunityApiTeamArray(rawData) {
    if (Array.isArray(rawData)) return rawData;

    const direct = rawData?.teams || rawData?.communityTeams || rawData?.community?.teams || rawData?.data?.teams || rawData?.result?.teams;
    return Array.isArray(direct) ? direct : [];
  }

function getScheduledCommunityTeamId(team) {
    return team?.teamId ?? team?.team?.id ?? team?.id ?? null;
  }

function getScheduledCommunityLeagueId(team) {
    return team?.leagueId ?? team?.team?.leagueId ?? null;
  }

async function refreshCurrentLeagueCaches(env) {
    const communityRoute = buildCommunityTargetUrl(`/communities/121`);
    const communityResponse = await proxyToCpl(communityRoute.targetUrl, {
      env,
      useKvCache: true,
      forceRefresh: true,
      cacheKey: communityRoute.cacheKey,
      ttlMs: communityRoute.ttlMs
    });

    let communityData = null;
    try {
      communityData = await communityResponse.clone().json();
    } catch (error) {
      console.warn("Scheduled community payload parse failed", error);
    }

    const groupedTeamIds = new Map();
    for (const team of getCommunityApiTeamArray(communityData)) {
      const teamId = getScheduledCommunityTeamId(team);
      const leagueId = getScheduledCommunityLeagueId(team);
      if (!isPositiveInteger(String(teamId)) || !isPositiveInteger(String(leagueId))) continue;

      const key = String(leagueId);
      if (!groupedTeamIds.has(key)) groupedTeamIds.set(key, []);
      groupedTeamIds.get(key).push(String(teamId));
    }

    for (const [leagueId, teamIds] of groupedTeamIds.entries()) {
      const leagueRoute = buildLeagueTargetUrl(`/leagues/${leagueId}`);
      await proxyToCpl(leagueRoute.targetUrl, {
        env,
        useKvCache: true,
        forceRefresh: true,
        cacheKey: leagueRoute.cacheKey,
        ttlMs: leagueRoute.ttlMs
      });

      const teamsRoute = buildLeagueTeamsTargetUrl(`/leagues/${leagueId}/teams`);
      await proxyToCpl(teamsRoute.targetUrl, {
        env,
        useKvCache: true,
        forceRefresh: true,
        cacheKey: teamsRoute.cacheKey,
        ttlMs: teamsRoute.ttlMs
      });

      await fetchLeagueMatchesBundle(env, {
        leagueId,
        limit: LEAGUE_MATCHES_LIMIT,
        teamIds,
        cacheKey: `leagues:matches:id=${leagueId}:limit=${LEAGUE_MATCHES_LIMIT}`
      }, {
        ttlMs: LEAGUE_MATCHES_CACHE_TTL_MS,
        forceRefresh: true,
        liveWindow: false
      });
    }
  }

async function refreshScheduledCaches(env, date = new Date()) {
  if (shouldRefreshDailyRankingCaches(date)) {
    await refreshCurrentRankingBundle(env, date);
  }

  if (shouldRefreshDailyLadderCaches(date)) {
    await refreshCurrentLadderCaches(env);
  }

  if (shouldRefreshDailyLeagueCaches(date)) {
    await refreshCurrentLeagueCaches(env);
  }

  if (shouldRunDailyTransferWatcher(date)) {
    const transferUrl = new URL(`${CPL_BASE}/cpl/api/transfers`);
    transferUrl.searchParams.set("age_range", "13-44");
    transferUrl.searchParams.set("limit", "5000");

    await proxyToCpl(transferUrl, {
      env,
      useKvCache: true,
      forceRefresh: true,
      cacheKey: TRANSFER_CACHE_KEY,
      ttlMs: TRANSFER_CACHE_TTL_MS
    });

    await runTransferWatcher(env);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (request.method !== "GET") {
      return jsonResponse(
        {
          error: "Method not allowed. Only GET and OPTIONS are supported."
        },
        405,
        {
          "Allow": "GET, OPTIONS"
        }
      );
    }

    try {
      if (url.pathname === "/rankings/players/all") {
        const config = buildRankingsAllConfig(url);

        return await fetchRankingBundle(config, {
          env
        });
      }

      if (url.pathname === "/rankings/players") {
        const { targetUrl, cacheKey, ttlMs } = buildRankingsTargetUrl(url);

        return await proxyToCpl(targetUrl, {
          env,
          useKvCache: true,
          cacheKey,
          ttlMs
        });
      }

      if (url.pathname === "/transfers") {
        const { targetUrl, cacheKey, ttlMs } = buildTransfersTargetUrl(url);

        return await proxyToCpl(targetUrl, {
          env,
          useKvCache: true,
          cacheKey,
          ttlMs
        });
      }

      if (url.pathname.startsWith("/communities/")) {
        const { targetUrl, cacheKey, ttlMs } = buildCommunityTargetUrl(url.pathname);

        return await proxyToCpl(targetUrl, {
          env,
          useKvCache: true,
          cacheKey,
          ttlMs
        });
      }

      if (/^\/ladders\/[0-9]+\/matches$/.test(url.pathname)) {
        const config = buildLadderMatchesConfig(url);
        const liveWindow = isLadderLiveResultWindow();
        const forceRefresh = url.searchParams.get("refresh") === "true";
        const ttlMs = liveWindow ? LADDER_MATCHES_LIVE_CACHE_TTL_MS : LADDER_MATCHES_CACHE_TTL_MS;

        return await fetchLadderMatchesBundle(env, config, { ttlMs, forceRefresh, liveWindow });
      }

      if (url.pathname.startsWith("/ladders/")) {
        const { targetUrl, cacheKey, ttlMs } = buildLadderTargetUrl(url.pathname);
        const forceRefresh = url.searchParams.get("refresh") === "true";

        return await proxyToCpl(targetUrl, {
          env,
          useKvCache: true,
          forceRefresh,
          cacheKey,
          ttlMs
        });
      }

      if (/^\/leagues\/[0-9]+\/matches$/.test(url.pathname)) {
        const config = buildLeagueMatchesConfig(url);
        const liveWindow = isLeagueLiveResultWindow();
        const forceRefresh = url.searchParams.get("refresh") === "true";
        const ttlMs = liveWindow ? LEAGUE_MATCHES_LIVE_CACHE_TTL_MS : LEAGUE_MATCHES_CACHE_TTL_MS;

        return await fetchLeagueMatchesBundle(env, config, { ttlMs, forceRefresh, liveWindow });
      }

      if (/^\/leagues\/[0-9]+\/teams$/.test(url.pathname)) {
        const { targetUrl, cacheKey, ttlMs } = buildLeagueTeamsTargetUrl(url.pathname);
        const forceRefresh = url.searchParams.get("refresh") === "true";

        return await proxyToCpl(targetUrl, {
          env,
          useKvCache: true,
          forceRefresh,
          cacheKey,
          ttlMs
        });
      }

      if (url.pathname.startsWith("/leagues/")) {
        const { targetUrl, cacheKey, ttlMs } = buildLeagueTargetUrl(url.pathname);
        const forceRefresh = url.searchParams.get("refresh") === "true";

        return await proxyToCpl(targetUrl, {
          env,
          useKvCache: true,
          forceRefresh,
          cacheKey,
          ttlMs
        });
      }

      if (url.pathname.startsWith("/championships/")) {
        const config = buildChampionshipConfig(url.pathname);
        const forceRefresh = url.searchParams.get("refresh") === "true";

        return await fetchChampionshipTournaments(env, config, forceRefresh);
      }

      if (url.pathname === "/tournaments/official/__data.json") {
        const { targetUrl, cacheKey, ttlMs } = buildOfficialTournamentsTargetUrl(url.pathname);

        return await proxyToCpl(targetUrl, {
          env,
          useKvCache: true,
          cacheKey,
          ttlMs
        });
      }

      if (url.pathname.startsWith("/api/tournaments/")) {
        const { targetUrl } = buildTournamentDetailTargetUrl(url.pathname);

        return await proxyToCpl(targetUrl, {
          env,
          useKvCache: false
        });
      }

      if (url.pathname.startsWith("/players/")) {
        const targetUrl = buildPlayerTargetUrl(url.pathname);

        return await proxyToCpl(targetUrl, {
          env,
          useKvCache: false
        });
      }

      return jsonResponse(
        {
          error: "Not found. Supported routes are /rankings/players, /rankings/players/all, /transfers, /communities/:communityId, /ladders/:ladderId, /ladders/:ladderId/matches, /leagues/:leagueId, /leagues/:leagueId/teams, /leagues/:leagueId/matches, /championships/:season/__data.json, /tournaments/official/__data.json, /api/tournaments/:tournamentId, /players/:playerId and /players/:playerId/stats."
        },
        404
      );
    } catch (error) {
      return jsonResponse(
        {
          error: "Bad request",
          detail: String(error?.message || error)
        },
        400
      );
    }
  },

  async scheduled(event, env, ctx) {
    const scheduledDate = event?.scheduledTime ? new Date(event.scheduledTime) : new Date();
    ctx.waitUntil(refreshScheduledCaches(env, scheduledDate));
  }
};
