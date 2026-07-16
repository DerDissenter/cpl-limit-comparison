# CPL data capabilities

This document inventories the CPL-related data sources that are evidenced in this repository. It describes the contract the application currently consumes, not a promise about undocumented upstream APIs. Endpoint templates below are copied from repository code or from the checked-in snapshot; no endpoint has been inferred.

Unless a source says otherwise, **last verified** means verified against repository code on 2026-07-11. It does not mean that the live upstream response was revalidated on that date.

## Proxy ranking players

- **Source name:** CPL player rankings through the project Cloudflare Worker.
- **Endpoint/location:** `https://cpl-proxy.dissenter-cpl-tools.workers.dev/rankings/players?page={page}&limit=100&country=All+countries&type={type}&season={season}` and the preferred bundle route `https://cpl-proxy.dissenter-cpl-tools.workers.dev/rankings/players/all?limit=100&country=All+countries&type={type}&season={season}` (`main.js`).
- **Current repository usage:** Loads one Official player snapshot, associates players with community teams, powers player tables, and supplies player IDs for detail imports. Ladder statistics are derived locally from Season-specific `playerStats` rows with `matchType=ladder`; the browser does not issue a separate Ladder request. The bundle route is tried first; paged requests are the fallback. Both views share one 24-hour `localStorage` entry.
- **Available fields:** The parser explicitly consumes page metadata (`page`, `limit`, `season`, `totalCount`); player `id`/`playerId`, `name`, `nick`, `teamId`, `team.id`, `team.name`, `country`, `rank`; and statistics `games`/`matches`, `kills`, `deaths`, `headshots`, `mvps`, their `total*` aliases, `kdRatio`, `hsPercentage`, plus `playerStats[].season` and `playerStats[].matchType`. The parser supports plain JSON and Svelte/devalue-style referenced data.
- **Derived fields:** Page-offset rank; official totals synthesized from `amateur`, `eos`, `cup`, `ladder`, and `league` rows when a usable `official` aggregate is absent; K/D (`kills / deaths`); headshot percentage (`headshots / kills * 100`); community-only rank after filtering and sorting; team name/logo joined from community data.
- **Known limitations:** The response remains undocumented and shape-tolerant. Match types are hard-coded. Local Ladder ordering uses kills, games, and player ID deterministically; the five displayed totals match the legacy Ladder response, but CPL exposes no documented tie-break contract. Only players whose team belongs to the selected community survive normalization.
- **Open API questions:** Which embedded `matchType` values are guaranteed? Are aggregate `official` rows guaranteed? What are the authoritative pagination, ranking tie-break, and rate-limit semantics?
- **Last verified:** 2026-07-16 live: `/all` returned HTTP 200 with 39 pages and 3,886 identities; all 3,316 positive Ladder rows derived from Official matched the separate legacy Ladder response for the five displayed totals.

## Proxy player details

- **Source name:** CPL player detail through the project Cloudflare Worker.
- **Endpoint/location:** `https://cpl-proxy.dissenter-cpl-tools.workers.dev/players/{playerId}` (`main.js`).
- **Current repository usage:** Imports complete player skill/limit data for comparison and detects special abilities. Player IDs originate in ranking data. Imported records are stored in `localStorage`.
- **Available fields:** `id`/`playerId`, `name`/`fullName`, `nick`/`nickname`, `teamId` (including nested team/lineup variants), `age`, birthday, `totalSkill`, `totalLimit`, favorite weapon/map, leadership, experience, starter state, `specials`, `globalModifiers`, and `lineups`. For aim, handling, quickness, determination, awareness, teamplay, gamesense, and movement, the normalizer accepts value and limit fields in several flat and nested spellings.
- **Derived fields:** Normalized string IDs; `loyal`, `fragger`, and `tryhard` booleans from special names; a formatted player text block; `importedAt` timestamp.
- **Known limitations:** The repository contains no raw player-detail fixture, so accepted fields are evidenced by normalization code rather than a stored response. Shape aliases are defensive and do not prove all variants occur upstream. No player-stats endpoint is used by current repository code.
- **Open API questions:** Which field spelling is canonical? Are skill values/limits always present and numeric? What are the meanings and schemas of `lineups`, `specials`, and `globalModifiers`? Is authentication ever required?
- **Last verified:** 2026-07-11 (repository code only).

## Proxy transfer list

- **Source name:** CPL transfer list through the project Cloudflare Worker.
- **Endpoint/location:** `https://cpl-proxy.dissenter-cpl-tools.workers.dev/transfers?age_range=13-44&limit=5000` (`main.js`).
- **Current repository usage:** Loads and caches transfer candidates, filters them, and recommends players better than the weakest compared player.
- **Available fields:** A response may expose arrays as the root, `transfers`, `players`, or `data`. Candidate recognition uses player `id`/`playerId`, name/nick, skill values/limits or `totalSkill`/`totalLimit`. When a transfer wrapper is present, the code retains `transferId`, `startBid`, `deadline`, `sellingTeamId`, status, and the original transfer object. Player specials and the player-detail fields understood by the shared normalizer are also consumed.
- **Derived fields:** Flattened/merged transfer and player record; deduplication by player ID; special-ability flags including loyal, fragger, tryhard, and fire-heart detection; comparison scores and recommendation ordering.
- **Known limitations:** The extractor recursively searches an undocumented payload and can merge duplicate sightings by player ID. The request fixes an age range and a nominal limit of 5,000; pagination behavior is not implemented. Cached data may outlive an upstream listing change until refreshed.
- **Open API questions:** Is 5,000 a guaranteed maximum or is pagination required? What is the canonical wrapper shape? What units/currency and time zone apply to bids and deadlines? Which transfer statuses exist?
- **Last verified:** 2026-07-11 (repository code only).

## Community membership and team metadata

- **Source name:** CPL community detail through the project Cloudflare Worker.
- **Endpoint/location:** `https://cpl-proxy.dissenter-cpl-tools.workers.dev/communities/121` (`main.js`; also recorded in the checked-in snapshot).
- **Current repository usage:** Establishes the project community name and team membership, then provides the base team identity used to join ladder, league, ranking, match, and tournament data.
- **Available fields:** Community name/title and tag; team `id`/`teamId`, name, manager/username, ranking, league ID/position, division, fame/fame points, logo filename/URL, country, and community tag.
- **Derived fields:** Deduplicated team list; numeric normalization; division names for known numeric divisions (`4` emerald, `5` diamond, `6` master); division icon URL; team-logo URL; empty ladder and league slots populated later by joins.
- **Known limitations:** Community ID `121` is fixed. The accepted response shapes are broad because no raw community response is checked in. The division map covers only three numeric values. Fallback demo team IDs exist in code, but those synthetic records are not an API source.
- **Open API questions:** What is the canonical membership array and team schema? Are community pagination, inactive members, and role metadata available? What is the complete division-ID mapping?
- **Last verified:** 2026-07-11 (repository code); normalized output captured 2026-06-21.

## Ladder standings

- **Source name:** CPL ladder detail/standings through the project Cloudflare Worker.
- **Endpoint/location:** `https://cpl-proxy.dissenter-cpl-tools.workers.dev/ladders/{ladderId}` with optional `?refresh=true` (`main.js`). The checked-in Season 12 snapshot records ladder `48`; current code derives the community ladder ID as `season + 36`.
- **Current repository usage:** Joins ladder positions and results onto community teams and supplies the ladder standings panel. The exporter stores normalized ladder-enriched teams.
- **Available fields:** Team ID/name, position/rank, points, matches, wins, losses, round difference, Buchholz, and streak.
- **Derived fields:** Deduplication by team ID and join onto community teams; formatted positions; the ladder ID derived from season.
- **Known limitations:** `season + 36` is a repository convention, not a documented upstream guarantee. Draws are not normalized for ladder standings. A force refresh is a worker-specific query option whose upstream behavior is not documented here.
- **Open API questions:** Is there an endpoint-supported way to discover a season's ladder ID? Are draws, status, division, or pagination fields available? What precisely does `refresh=true` invalidate?
- **Last verified:** 2026-07-11 (repository code); ladder 48 output captured 2026-06-21.

## Ladder matches

- **Source name:** CPL ladder matches through the project Cloudflare Worker.
- **Endpoint/location:** `https://cpl-proxy.dissenter-cpl-tools.workers.dev/ladders/{ladderId}/matches?limit=100[&teamIds={comma-separated IDs}][&refresh=true]` (`main.js`).
- **Current repository usage:** Shows recent and upcoming matches involving community teams; requests can be worker-filtered by team IDs.
- **Available fields:** Match ID, status, map, date/start time, home/away team IDs and names, home/away rounds/scores, and winner ID. The shared match normalizer also accepts stage/round names, status, and order when supplied.
- **Derived fields:** Winner from unequal scores when `winnerId` is absent; deduplication by match ID; played/live/upcoming/unknown bucket; community-team/opponent identity and ladder-position joins; CPL match-page link.
- **Known limitations:** Request limit is fixed at 100. The UI further limits recent/upcoming display to 20 each. A match is discarded without an ID and both team IDs. Status classification is heuristic.
- **Open API questions:** Are `teamIds`, `limit`, and `refresh` stable worker parameters? Is there pagination or a date cursor? What are all match statuses, and are dates always UTC ISO strings?
- **Last verified:** 2026-07-11 (repository code only).

## League detail and standings

- **Source name:** CPL league detail and league teams through the project Cloudflare Worker.
- **Endpoint/location:** `https://cpl-proxy.dissenter-cpl-tools.workers.dev/leagues/{leagueId}` and `https://cpl-proxy.dissenter-cpl-tools.workers.dev/leagues/{leagueId}/teams`, each with optional `?refresh=true` (`main.js`).
- **Current repository usage:** League IDs found on community teams are fetched, league entries are joined back to those teams, and league standings are rendered.
- **Available fields:** Team ID/name, league ID, position/rank, points, games, wins, draws, losses, and round difference. League metadata is retained as the raw league-detail response for display helpers.
- **Derived fields:** Fallback league ID from the requested route; deduplication by league/team pair; join onto community teams; formatted league positions.
- **Known limitations:** The repository does not define a strict league-detail schema and has no raw league fixture. It may fetch more than one league because community teams can have different league IDs. No standings pagination is implemented.
- **Open API questions:** What fields belong to the league-detail object versus `/teams`? Is `/teams` complete without pagination? How are league phase, season, schedule, and promotion/relegation represented?
- **Last verified:** 2026-07-11 (repository code only).

## League matches

- **Source name:** CPL league matches through the project Cloudflare Worker.
- **Endpoint/location:** `https://cpl-proxy.dissenter-cpl-tools.workers.dev/leagues/{leagueId}/matches?limit=100[&teamIds={comma-separated IDs}][&refresh=true]` (`main.js`).
- **Current repository usage:** Shows community-team league fixtures and results, grouped by league and match state.
- **Available fields:** Same shared match contract as ladder matches: ID, status, map, date, home/away IDs and names, scores, winner, and optional stage/round context.
- **Derived fields:** Winner from scores; deduplication; match-state buckets; community/opponent and league-position joins; CPL match-page link.
- **Known limitations:** Request limit is fixed at 100; the UI retains up to 20 recent and 20 upcoming matches per view. Match-state interpretation is heuristic, and no pagination is implemented.
- **Open API questions:** Are filtering and refresh parameters stable? Are postponed/cancelled matches represented distinctly? Can matches be queried incrementally?
- **Last verified:** 2026-07-11 (repository code only).

## Championship-family tournament discovery

- **Source name:** Championship tournament list through the project Cloudflare Worker.
- **Endpoint/location:** `https://cpl-proxy.dissenter-cpl-tools.workers.dev/championships/{season}/__data.json` with optional `?refresh=true` (`main.js`). The checked-in Season 12 snapshot records the older worker URL with `?x-sveltekit-invalidated=001`. The Worker source is versioned in `worker/worker.js`.
- **Current repository usage:** Discovers at most 16 tournament summaries/IDs for a season before detail requests. Championship-family categories are inferred from names (`challengers`, `contenders`, `legends`, `championship`).
- **Available fields:** Summary parsing consumes tournament ID, name, status, type, season, tier, winner ID, sponsor, format, and logo URL where present.
- **Derived fields:** Season-filtered summaries and tournament IDs; inferred championship category from name; three-hour local cache.
- **Known limitations:** The frontend route resembles SvelteKit data output and is not a documented CPL API contract. The upstream CPL route remains an implementation detail rather than a supported public API.
- **Open API questions:** What upstream endpoint does the worker use, and what is its supported discovery contract? Will the worker route remain stable across CPL frontend changes? Are tournament type, season, and tier authoritative enough to replace name inference? How should more than 16 matching tournaments be handled?
- **Last verified:** 2026-07-11 (repository code); Season 12 snapshot captured 2026-06-21.

## Official/End-of-Season tournament discovery

- **Source name:** Official tournament list through the project Cloudflare Worker.
- **Endpoint/location:** `https://cpl-proxy.dissenter-cpl-tools.workers.dev/tournaments/official/__data.json` (`main.js`; also recorded in the snapshot).
- **Current repository usage:** Selects official tournaments for a requested season, limits them to 16, then loads detail records for End-of-Season display. Categories are inferred as `luminous` or `cyberathletes` from name or tier.
- **Available fields:** Tournament summary ID, name, status, type, season, tier, winner ID, sponsor, format, and logo URL where present.
- **Derived fields:** Season-filtered IDs/summaries, inferred official category, three-hour local cache.
- **Known limitations:** This is another SvelteKit-shaped worker route rather than a documented API contract. Category inference falls back to tier `0`/`1`. There is no force-refresh parameter on the URL builder even though the calling function accepts a refresh flag for local-cache bypass.
- **Open API questions:** Which official tournament types and tiers exist? Is the list complete and ordered? Is there an API-native season/category filter and refresh mechanism?
- **Last verified:** 2026-07-11 (repository code); output captured 2026-06-21.

## Tournament detail

- **Source name:** CPL tournament detail through the project Cloudflare Worker.
- **Endpoint/location:** `https://cpl-proxy.dissenter-cpl-tools.workers.dev/api/tournaments/{tournamentId}` (`main.js`).
- **Current repository usage:** Enriches discovered championship and official tournament IDs, finds community-team participation, renders status/position/record, and provides match links. Failed individual details become warnings rather than aborting the entire export.
- **Available fields:** Tournament ID, name, status, type, season, tier, winner ID, sponsor, format, logo URL; tournament and stage team entries; stages with ID, name, status, format type, teams, rounds, and matches. Team entries consume team ID/name/logo, position, games, wins, draws, losses, round difference, points, and status. Matches consume the shared match fields documented above.
- **Derived fields:** Sanitized tournament/stage/team/match structures; community-team participation; best/latest stage entry; tournament category; record string; relevant stage; status (`Winner`, `Eliminated`, etc.); position labels such as `#1`, `#2`, `Top 4`, or `Top 8`; winner from scores; match buckets and CPL match-page links.
- **Known limitations:** Recursive match extraction and status/position derivation are heuristic. Tournament details are fetched one by one, capped by the 16-item discovery limit. A checked-in snapshot verifies normalized output, not the raw response schema.
- **Open API questions:** Is this detail route versioned/stable? What are the canonical nesting rules for stages and rounds? Are placement and elimination status directly available? What are all format/status/type values?
- **Last verified:** 2026-07-11 (repository code); normalized championship and EOS details captured 2026-06-21.

## CPL media and navigation URLs

- **Source name:** CPL team logos, division icons, and human-facing CPL pages.
- **Endpoint/location:** Team logos use `https://media.cplmanager.com/teams/{teamId}/{logoFileName}`; division icons use `https://www.cplmanager.com/logos/divisions/{divisionName}.png`. The app builds human-facing team, league, player, free-agent player, and match URLs under `https://www.cplmanager.com/cpl/...` (`main.js`).
- **Current repository usage:** Displays logos/icons and links rendered entities to CPL Manager pages. These page URLs are navigation targets, not JSON data APIs.
- **Available fields:** The media locations require IDs/names and filenames supplied by other sources; they do not provide fields consumed as JSON.
- **Derived fields:** Fully qualified media and page URLs; inline synthetic SVG fallbacks for demo data.
- **Known limitations:** Filename/path stability, authentication, and cache behavior are not documented in the repository. Synthetic demo images are not CPL data.
- **Open API questions:** Are stable/default logo URLs available without a filename? Is there a supported media-version or cache-invalidation contract?
- **Last verified:** 2026-07-11 (repository code); concrete media URLs appear in the 2026-06-21 snapshot.

## Checked-in community season snapshot

- **Source name:** Repository-generated CPL community season snapshot.
- **Endpoint/location:** `exports/community-season-snapshots/cpl-community-121-season-12-day-35-2026-06-21.json`, generated by `scripts/export-community-season.mjs`.
- **Current repository usage:** Durable historical artifact and the only checked-in CPL data fixture. The exporter reuses application fetchers and normalizers; the snapshot itself is not loaded by the browser application.
- **Available fields:** Schema/export metadata; source URLs; counts and warnings; community; season/day/ladder ID; normalized teams; normalized players; players grouped by team; normalized championship/EOS tournament items; tournaments grouped by team. It records the concrete normalized field sets described in the sections above.
- **Derived fields:** `isSeasonEnd`, counts, team/player/tournament groupings, joined team standings, community player rank, tournament status/position/record/match buckets, and export timestamps/filename.
- **Known limitations:** It is a single Community 121, Season 12, day-35 snapshot exported on 2026-06-21. Raw upstream payloads were not included, so it cannot prove raw schemas or current endpoint availability. Some historical URLs reflect the worker behavior at export time and differ from current URL builders.
- **Open API questions:** Should future snapshots include selected raw payloads or a schema manifest? How should snapshot schema versions migrate? Which seasons/communities should be retained for regression coverage?
- **Last verified:** 2026-07-11 (file structure); data exported 2026-06-21.

## Local and synthetic inputs (not CPL APIs)

For completeness, the application also uses browser `localStorage` for ranking, transfer, community, tournament, imported-player, and ranking-baseline caches. It contains manually seeded historical community rankings and demo teams/players/matches in `main.js`. These are fallbacks, caches, or synthetic inputs—not independent CPL endpoints—and must not be treated as authoritative CPL data.
