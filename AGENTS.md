## CPL API and data feasibility

Before proposing features, changing CPL data access, or evaluating
technical feasibility, read:

- `docs/cpl-data-capabilities.md`

Treat this document as the current starting point for known CPL endpoints,
available fields, derivable data, limitations, and open API questions.

Do not assume that the document is complete or automatically correct.
Compare relevant claims against the current implementation, fixtures,
tests, and recent repository changes.

Do not repeat a full API investigation when the required capability is
already documented and still supported by the current code.

If the documentation and implementation disagree, report the discrepancy.
Do not invent endpoints or undocumented response fields.

## Cloudflare Worker and cache changes

- Treat `worker/worker.js` as the Worker source of truth and `wrangler.jsonc` as
  the deploy configuration. Verify routes, KV bindings, and cron triggers in
  those files before changing frontend requests or describing production
  behavior.
- Use the Official player-ranking snapshot as the canonical upstream dataset.
  Derive Ladder player stats locally from its `playerStats` entries; do not add
  a separate CPL or KV Ladder-ranking snapshot while those entries are present.
- Calculate daily snapshot boundaries using the CPL day, which changes at
  02:00 in `Europe/Berlin`. Prefer deterministic snapshot keys and avoid
  `KV.list()` in request paths.
- Browser-cache writes must tolerate storage quota errors. When a cache key is
  versioned, remove obsolete keys on a best-effort basis and add a regression
  test for the migration and quota behavior.
- Do not run a production deploy without explicit user confirmation. Validate
  Worker changes locally and with `npm run worker:dry-run` first.

## Validation and delivery

- Run `npm test` and `npm run check` after JavaScript or Worker changes. Run
  `npm run worker:dry-run` when Worker code or Wrangler configuration changes.
- Preserve unrelated working-tree changes and keep commits scoped. Before any
  commit or push, summarize the exact files and checks and wait for explicit
  user confirmation.
