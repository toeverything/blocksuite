# CLAUDE.md

Editor library for **Labre** — a markdown + whiteboard editor for enterprise
transformation architects. Fork of BlockSuite (AFFiNE's editor), **assumed
divergent** from upstream (see `docs/adr/0001`). This repo is the open-source
library ONLY; the SaaS lives in the private `labreapp` repo, which consumes
this library as npm packages (`@labre/*` scope, publication pending).

## Commands

```sh
yarn dev                # playground (the editor in a browser)
yarn build              # typecheck + build everything (tsc -b)
yarn test:unit          # all unit tests (root vitest workspace)
yarn test:integration   # browser-mode integration tests (chromium)
yarn lint:format        # prettier check
```

Run a single package's tests from its directory: `yarn vitest run <filter>`.
The integration suite is load-sensitive: keep `--no-file-parallelism` (already
in the script) and expect occasional cold-start retries.

## Architecture entry points

- `packages/affine/all/src/schemas.ts` + `extensions/{store,view}.ts` — the
  three assembly points. All three honor **block flags**
  (`@blocksuite/affine/flags`): optional blocks can be shipped dark and
  enabled at runtime by the host app. Core (root, surface, note, paragraph,
  base gfx) is not flaggable. See `docs/adr/0002`.
- `packages/affine/shared/src/services/telemetry-service/` — the telemetry
  bus. The lib emits typed events; the host injects the adapter
  (`NoopTelemetryExtension` standalone, PostHog in labreapp). Taxonomy
  contract in its README. See `docs/adr/0003`.
- `packages/affine/gfx/wardley/`, `gfx/edgy/` — the business framework
  modules (canonical examples for new frameworks, e.g. cynefin).
- Branch model: `trimed-lib` is the main branch; feature branches off it.

## Conventions

- Conventional commits, enforced scopes (commitlint): page, edgeless,
  database, blocks, store, sync, std, presets, playground, inline, lit,
  examples. Use `blocks` when unsure.
- Prettier is the only formatter (husky runs it on commit). TypeScript
  strict; relative imports use the `.js` suffix.
- Code comments and identifiers in English.

## Red zones — never merge without human review

- License headers / MPL-2.0 obligations (file-level copyleft).
- `packages/framework/store` and `sync` (Yjs document format: a bad change
  corrupts user documents irreversibly).
- Schema/model changes of existing blocks (`packages/affine/model`) — they
  must stay loadable by documents created before the change.
- Anything that publishes packages or touches CI release workflows.

## Block / framework template

A new block (or gfx framework module) is DONE only when it has ALL of:

1. **Model/schema** in `packages/affine/model` (or element model for gfx),
   with a migration story for existing documents.
2. **Store extension** + **view extension**, registered in
   `packages/affine/all/src/extensions/{store,view}.ts`.
3. **A flag** in `packages/affine/all/src/flags.ts` (`OPTIONAL_BLOCKS`) and
   gating in the three assembly points — new blocks ship dark by default
   until the host enables them.
4. **Telemetry**: creation sites emit `BlockCreated` (blocks) or
   `FrameworkElementAdded`/`FrameworkToolPicked` (frameworks). Lifecycle
   events (edited/deleted/abandoned/duration) come free from
   `BlockLifecycleTelemetryWatcher`.
5. **Unit tests** (and an integration spec if it renders on the canvas).
6. **One changeset** (`yarn changeset`) describing the user-facing change.

Mirror `gfx/wardley` for structure: consts / element-renderer / element-view /
node/ / toolbar/ / view.ts.

## Upstream policy

We do not track upstream, but `..\AFFiNE-upstream` (shallow clone of
toeverything/AFFiNE, editor under `blocksuite/`) is kept as a reference for
targeted cherry-picks (security bumps, block fixes). Structural drift is low
(see autoDevFactory `docs/etude-affine-upstream.md`). Never publish under the
`@blocksuite/*` scope — it belongs to the AFFiNE team.
