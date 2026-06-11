# ADR 0002 — Flag-gated block registry

- Status: accepted (June 2026)
- Deciders: Mathieu Jolly

## Context

The product factory (autoDevFactory spec § 4.7) requires that an AI agent can
deliver a block "dark", roll it out progressively behind a PostHog flag, and
kill it without redeploying. Upstream AFFiNE has feature flags for behaviors
but nothing conditions block registration: `AffineSchemas` and the
store/view extension lists were static.

A June 2026 inventory arbitration decided to KEEP all 20 inherited blocks
(only `attachment` is frozen), which makes runtime deactivation — rather than
deletion — the mechanism that bounds the blast radius of autonomous changes.

## Decision

A `BlockFlags` map (`@blocksuite/affine/flags`) is honored by the three
assembly points: `getAffineSchemas(flags)`, `getInternalStoreExtensions(flags)`
and `getInternalViewExtensions(flags)`. ~22 optional blocks/gfx modules;
the structural core (root, surface, note, paragraph, base gfx tools) is not
flaggable. Missing flags default to **enabled** — zero-arg calls behave
exactly as before.

## Consequences

- New blocks ship dark by default (block template rule #3 in CLAUDE.md).
- Disabling a block does NOT migrate documents that contain it: a flag may
  only be turned off for blocks that never reached users' documents.
- Fine granularity decisions: disabling `embed` keeps linked/synced doc
  embeds (they live in `embed-doc`); `latex` covers block + inline; `frame`
  covers block + frame panel.
