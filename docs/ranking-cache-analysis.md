# Ranking cache analysis

Verified on 2026-07-16 against the production Worker `cpl-proxy` and Season 13.

## Confirmed production configuration

- Entry point: `worker/worker.js`, downloaded from deployed version `d905fe1b-e4b9-489c-ab30-b6c31185ee17`.
- KV binding: `CPL_CACHE` -> `b07577ad340247dea4322f0891d9eae9`.
- Cron: `0 * * * *`; the handler uses Europe/Berlin hour checks and refreshes rankings at 03:00, after the CPL day changes at 02:00.
- `.github/workflows/community-season-export.yml` runs at `15 1 * * *`, but exits before fetching unless it is CPL season day 35.
- No `KV.list()` call exists in the Worker request path.

## Verified requests

| URL | Status | Result |
| --- | ---: | --- |
| `https://cpl-proxy.dissenter-cpl-tools.workers.dev/rankings/players?page=1&limit=100&country=All+countries&type=official&season=13` | 200 | 88,435-byte response; `X-Cache-Status: HIT` |
| `https://cpl-proxy.dissenter-cpl-tools.workers.dev/rankings/players/all?limit=100&country=All+countries&type=official&season=13` | 200 | 39 pages, 3,886 players; `/all` is implemented and live |
| `https://cpl-proxy.dissenter-cpl-tools.workers.dev/rankings/players?page=1&limit=100&country=All+countries&type=ladder&season=13` | 200 | Separate legacy Ladder response, checked before removing it from the client path |
| `https://cpl-proxy.dissenter-cpl-tools.workers.dev/rankings/players/all?limit=100&country=All+countries&type=ladder&season=13` | 200 | 39-page legacy Ladder bundle, checked before canonicalization |
| `https://www.cplmanager.com/cpl/rankings/players/__data.json?page={page}&limit=100&country=All+countries&type=official&season=13` | via Worker | Upstream page template confirmed in deployed source |

An anonymized decoded Season 13 sample from the Official response:

```json
{
  "player": "<redacted>",
  "playerStats": [
    { "season": 13, "matchType": "official", "games": 45, "kills": 1025, "deaths": 653 },
    { "season": 13, "matchType": "ladder", "games": 21, "kills": 490, "deaths": 310 },
    { "season": 13, "matchType": "league", "games": 15, "kills": 322, "deaths": 223 },
    { "season": 13, "matchType": "cup", "games": 15, "kills": 342, "deaths": 213 }
  ]
}
```

Both bundles contained the same 3,886 player/team identities. There were 3,316 positive Season 13 Ladder rows in Official. Locally derived Ladder values matched the legacy Ladder response for all 3,316 across `games`, `kills`, `deaths`, `headshots`, and `mvps` (zero mismatches).

## Root cause and operation counts

Production held 80 ranking keys: 39 page keys plus one bundle key for each of `official` and `ladder`. The old `/all` TTL was one hour. Once expired, `fetchRankingBundle()` forced every page past its nominal 24-hour cache. One 39-page rebuild caused 39 CPL fetches, 39 page writes, and one bundle write: 40 KV writes. Rebuilding Official and Ladder separately cost 78 CPL fetches and 80 writes. Concurrent misses did not share a refresh and could multiply that cost. A cache hit cost one KV read and no CPL fetch; there was no `KV.list()`.

The normal Cron enters the ranking branch only once in the Berlin 03:00 hour and refreshes Official only. One successful Cron therefore explains about 40 writes, not 50% of the Free-plan 1,000-write allowance and not 50% of its 100,000-read allowance. The email cannot be explained by that run alone. Expired-bundle requests, concurrent misses, other scheduled branches, and account-wide KV usage can add operations. Production observability was disabled, so the exact historical split is not reconstructable.

The browser error is related but separate: the two normalized ranking caches measured about 3.32 MB together; the shared cache is about 1.67 MB. The raw Community/Ladder cache measured about 508 KB and its compact form about 124 KB. Previously, its `localStorage.setItem()` error was uncaught.

## Cache strategy

| Data kind | CPL source | Worker endpoint | KV strategy before | KV strategy after | CPL requests per CPL day |
| --- | --- | --- | --- | --- | ---: |
| Official players | `/cpl/rankings/players/__data.json?type=official` | `/rankings/players/all?type=official` | 39 page keys + one hourly bundle key | One `v2` snapshot per Season/CPL day; previous-day and legacy read-only fallbacks | 39 pages once |
| Ladder players | Separate upstream `type=ladder` | `/rankings/players/all?type=ladder` | 39 page keys + separate bundle key | Same Official snapshot; browser derives `playerStats.matchType === "ladder"` | 0 |
| Community + standings | Community and ladder endpoints | `/communities/121`, `/ladders/49` | Raw browser payload | Compact normalized browser payload; Worker unchanged | unchanged |

The request path never builds a snapshot. It reads today's deterministic key, then yesterday's or the legacy Official bundle. Only the scheduled 03:00 Berlin refresh may fetch all CPL pages and write the daily snapshot. Repeating it for the same CPL day reuses the existing snapshot: no CPL fetch and no write.
