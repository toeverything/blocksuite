import { LifeCycleWatcher } from '@blocksuite/std';

import {
  TelemetryProvider,
  type TelemetryService,
} from './telemetry-service.js';

/**
 * A block deleted within this window after its creation counts as abandoned.
 */
export const ABANDON_WINDOW_MS = 15_000;

/**
 * Two local edits on the same block further apart than this gap belong to two
 * distinct editing sessions (each session emits BlockEdited once and
 * BlockUsageDuration when it closes).
 */
export const IDLE_GAP_MS = 30_000;

/**
 * The subset of the store `blockUpdated` payload the tracker relies on —
 * structurally compatible with `Store['slots']['blockUpdated']` payloads.
 */
export type BlockLifecyclePayload = {
  type: 'add' | 'update' | 'delete';
  id: string;
  flavour: string;
  isLocal: boolean;
  /** Only on 'add': true when the block comes from the initial doc load. */
  init?: boolean;
};

/**
 * Turns raw store mutations into the block lifecycle taxonomy (see README):
 * BlockEdited / BlockDeleted / BlockAbandoned / BlockUsageDuration.
 *
 * BlockCreated is intentionally NOT emitted here — it stays a UI-intent
 * event emitted at insertion sites (slash menu, toolbars), to avoid double
 * counting. Remote and initial-load mutations are ignored (`isLocal` only):
 * the taxonomy describes user intent, not store mechanics.
 *
 * Pure logic, injectable clock — see the unit tests.
 */
export class BlockLifecycleTracker {
  /** Local creation time per block id, for abandon detection. */
  private readonly _createdAt = new Map<string, number>();

  /** Open editing sessions per block id. */
  private readonly _sessions = new Map<
    string,
    { start: number; last: number; flavour: string }
  >();

  constructor(
    private readonly _telemetry: TelemetryService,
    private readonly _now: () => number = () => Date.now()
  ) {}

  handle(payload: BlockLifecyclePayload) {
    if (!payload.isLocal) return;
    const t = this._now();
    const { id, flavour } = payload;

    switch (payload.type) {
      case 'add': {
        if (!payload.init) this._createdAt.set(id, t);
        break;
      }
      case 'update': {
        const session = this._sessions.get(id);
        if (session && t - session.last <= IDLE_GAP_MS) {
          session.last = t;
          break;
        }
        if (session) this._closeSession(id, session);
        this._telemetry.track('BlockEdited', { flavour });
        this._sessions.set(id, { start: t, last: t, flavour });
        break;
      }
      case 'delete': {
        this._telemetry.track('BlockDeleted', { flavour });
        const born = this._createdAt.get(id);
        if (born !== undefined && t - born <= ABANDON_WINDOW_MS) {
          this._telemetry.track('BlockAbandoned', {
            flavour,
            reason: 'deleted-after-create',
            ageMs: t - born,
          });
        }
        this._createdAt.delete(id);
        const session = this._sessions.get(id);
        if (session) this._closeSession(id, session);
        break;
      }
    }
  }

  /** Close every open session (editor unmount, page close). */
  flush() {
    for (const [id, session] of [...this._sessions]) {
      this._closeSession(id, session);
    }
    this._createdAt.clear();
  }

  private _closeSession(
    id: string,
    session: { start: number; last: number; flavour: string }
  ) {
    this._sessions.delete(id);
    if (session.last > session.start) {
      this._telemetry.track('BlockUsageDuration', {
        flavour: session.flavour,
        durationMs: session.last - session.start,
      });
    }
  }
}

/**
 * Wires the tracker to the editor: subscribes to store block mutations while
 * the editor is mounted. Inert when no TelemetryService is injected.
 */
export class BlockLifecycleTelemetryWatcher extends LifeCycleWatcher {
  static override readonly key = 'block-lifecycle-telemetry';

  private _subscription?: { unsubscribe: () => void };

  private _tracker?: BlockLifecycleTracker;

  override mounted() {
    const telemetry = this.std.getOptional(TelemetryProvider);
    if (!telemetry) return;

    const tracker = new BlockLifecycleTracker(telemetry);
    this._tracker = tracker;
    this._subscription = this.std.store.slots.blockUpdated.subscribe(payload =>
      tracker.handle(payload)
    );
  }

  override unmounted() {
    this._subscription?.unsubscribe();
    this._subscription = undefined;
    this._tracker?.flush();
    this._tracker = undefined;
  }
}
