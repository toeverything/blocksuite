# ADR 0001 — Assumed divergence from BlockSuite upstream

- Status: accepted (June 2026)
- Deciders: Mathieu Jolly

## Context

This repo forked the BlockSuite mirror ~mid-2025 to build Wardley/EDGY
whiteboard tooling. Upstream development moved into the AFFiNE monorepo
(`toeverything/AFFiNE`, `blocksuite/` directory). A June 2026 study
(autoDevFactory `docs/etude-affine-upstream.md`) measured the drift: upstream
went 0.22.4 → 0.26.3 with **no structural reorganization** (same packages,
same 20 blocks, same registration mechanism, same telemetry service).

## Decision

We own this code and do not track upstream. A shallow reference clone
(`..\AFFiNE-upstream`) is kept for **targeted cherry-picks only** (security
dependency bumps, block bug fixes, turbo-renderer improvements). A periodic
"upstream diff" check (monthly, eventually an agent in the factory) watches
for cherry-pick candidates.

## Consequences

- We can simplify and specialize aggressively (flags registry, telemetry
  taxonomy, framework modules) without merge debt.
- Security fixes must be back-ported deliberately — nobody does it for us.
- Packages must be renamed before publication: `@blocksuite/*` belongs to
  the AFFiNE team; ours publish under `@labre/*`.
