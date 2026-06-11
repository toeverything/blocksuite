# Telemetry service — event taxonomy

The editor never talks to an analytics backend directly. It emits typed events
on an internal bus (`TelemetryService`) and the **host application injects the
adapter**:

```ts
// Standalone (playground, tests, self-hosted without analytics):
import { NoopTelemetryExtension } from '@blocksuite/affine-shared/services';

// SaaS host (PostHog, GA4…):
import { TelemetryExtension } from '@blocksuite/affine-shared/services';
const PostHogTelemetry = TelemetryExtension({
  track: (event, props) => posthog.capture(event, props),
});
```

Emission sites always use the optional accessor, so a missing adapter is safe:

```ts
std.getOptional(TelemetryProvider)?.track('FrameworkElementAdded', { ... });
```

## Block lifecycle taxonomy (the contract)

Every block flavour reports the same five moments, so product analytics can
compare blocks with one query. **A new block is not done until it emits these
events** (this is part of the block template):

| Event                | When                                                          | Required props |
| -------------------- | ------------------------------------------------------------- | -------------- |
| `BlockCreated`       | the block is inserted by a user action                        | `blockType` |
| `BlockEdited`        | first edit of an editing session on the block                 | `flavour` |
| `BlockDeleted`       | the block is removed by a user action                         | `flavour` |
| `BlockAbandoned`     | created then emptied/undone/deleted shortly after creation    | `flavour`, `reason` (`emptied` \| `deleted-after-create` \| `undo`), `ageMs` |
| `BlockUsageDuration` | end of an editing session on the block                        | `flavour`, `durationMs` |

`BlockEdited`, `BlockDeleted`, `BlockAbandoned` and `BlockUsageDuration` are
emitted automatically for every flavour by `BlockLifecycleTelemetryWatcher`
(registered in the foundation view extension, fed by store mutations, local
changes only). `BlockCreated` stays a UI-intent event emitted at insertion
sites — do not emit it from store plumbing.

Conventions:

- `flavour` is the store flavour (`affine:paragraph`, `affine:database`…).
- `page` distinguishes `doc editor` vs `whiteboard editor` when relevant.
- Events describe **user intent**, not store mechanics: a programmatic
  migration that rewrites blocks must not emit lifecycle events.

## Framework diagram taxonomy (wardley / edgy / cynefin…)

Business framework diagrams share one vocabulary; `framework` segments,
`element` identifies what was manipulated:

| Event                    | When                                  | `element` examples |
| ------------------------ | ------------------------------------- | ------------------ |
| `FrameworkElementAdded`  | an element is created from a toolbox  | `background:classic`, `background:opportunity`, `node:component`, `node:market`, `node:pipeline` |
| `FrameworkToolPicked`    | a framework drawing tool is activated | `connector:link`, `connector:arrow` |
| `FrameworkLegendCreated` | an auto-legend is generated           | `legend` |

Adding a framework = reuse these three events with a new `framework` value
(add it to the `FrameworkElementEvent['framework']` union in `lifecycle.ts`).

## Legacy events

The historical AFFiNE events (`CanvasElementAdded`, `DocCreated`, slash menu,
database, attachment…) remain in `TelemetryEventMap` untouched; new code
should prefer the taxonomies above.
