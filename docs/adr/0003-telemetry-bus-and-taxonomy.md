# ADR 0003 — Telemetry bus and event taxonomy

- Status: accepted (June 2026)
- Deciders: Mathieu Jolly

## Context

The improvement loop (autoDevFactory spec § 4.1) is blind without per-block
usage telemetry. The library already had an injectable `TelemetryService`
(same seam AFFiNE uses, injecting GA4 app-side), but no default adapter, no
uniform per-block taxonomy, and the wardley/edgy toolboxes emitted nothing.

## Decision

1. **The library never talks to an analytics backend.** It emits typed
   events; the host injects the adapter. `NoopTelemetryExtension` is the
   standalone default (wired in the playground); labreapp injects PostHog.
2. **One lifecycle taxonomy for every block flavour**: BlockCreated (UI
   intent, emitted at insertion sites) + BlockEdited / BlockDeleted /
   BlockAbandoned / BlockUsageDuration, emitted automatically by
   `BlockLifecycleTelemetryWatcher` from store mutations (local changes
   only, sessions bounded by a 30 s idle gap, abandon window 15 s).
3. **One framework taxonomy** (FrameworkElementAdded / FrameworkToolPicked /
   FrameworkLegendCreated) segmented by `framework` (wardley, edgy,
   cynefin…) and `element`.

Contract documented in
`packages/affine/shared/src/services/telemetry-service/README.md`.

## Consequences

- The discovery agent can compare blocks with one PostHog query.
- A new framework reuses the three framework events — no new event names.
- Legacy AFFiNE events remain for compatibility; new code prefers the
  taxonomies.
