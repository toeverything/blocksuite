import { type Logger, Slot } from '@blocksuite/global/utils';
import type { Doc } from 'yjs';

import { SharedPriorityTarget } from '../utils/async-queue.js';
import { MANUALLY_STOP, throwIfAborted } from '../utils/throw-if-aborted.js';
import { DocEngineStep, DocPeerStep } from './consts.js';
import { type DocPeerStatus, SyncPeer } from './peer.js';
import type { DocSource } from './source.js';

export interface DocEngineStatus {
  step: DocEngineStep;
  main: DocPeerStatus | null;
  shadows: (DocPeerStatus | null)[];
  retrying: boolean;
}

/**
 * # DocEngine
 *
 * ```
 *                    ┌────────────┐
 *                    │  DocEngine │
 *                    └─────┬──────┘
 *                          │
 *                          ▼
 *                    ┌────────────┐
 *                    │   DocPeer  │
 *          ┌─────────┤    main    ├─────────┐
 *          │         └─────┬──────┘         │
 *          │               │                │
 *          ▼               ▼                ▼
 *   ┌────────────┐   ┌────────────┐   ┌────────────┐
 *   │   DocPeer  │   │   DocPeer  │   │   DocPeer  │
 *   │   shadow   │   │   shadow   │   │   shadow   │
 *   └────────────┘   └────────────┘   └────────────┘
 * ```
 *
 * doc engine manage doc peers
 *
 * Sync steps:
 * 1. start main sync
 * 2. wait for main sync complete
 * 3. start shadow sync
 * 4. continuously sync main and shadows
 */
export class DocEngine {
  get rootDocId() {
    return this.rootDoc.guid;
  }

  get status() {
    return this._status;
  }

  private _status: DocEngineStatus;

  private _abort = new AbortController();

  readonly onStatusChange = new Slot<DocEngineStatus>();

  readonly priorityTarget = new SharedPriorityTarget();

  constructor(
    readonly rootDoc: Doc,
    readonly main: DocSource,
    readonly shadows: DocSource[],
    readonly logger: Logger
  ) {
    this._status = {
      step: DocEngineStep.Stopped,
      main: null,
      shadows: shadows.map(() => null),
      retrying: false,
    };
    this.logger.debug(`syne-engine:${this.rootDocId} status init`, this.status);
  }

  private setStatus(s: DocEngineStatus) {
    this.logger.debug(`syne-engine:${this.rootDocId} status change`, s);
    this._status = s;
    this.onStatusChange.emit(s);
  }

  start() {
    if (this.status.step !== DocEngineStep.Stopped) {
      this.forceStop();
    }
    this._abort = new AbortController();

    this.sync(this._abort.signal).catch(err => {
      // should never reach here
      this.logger.error(`syne-engine:${this.rootDocId}`, err);
    });
  }

  canGracefulStop() {
    return !!this.status.main && this.status.main.pendingPushUpdates === 0;
  }

  async waitForGracefulStop(abort?: AbortSignal) {
    await Promise.race([
      new Promise((_, reject) => {
        if (abort?.aborted) {
          reject(abort?.reason);
        }
        abort?.addEventListener('abort', () => {
          reject(abort.reason);
        });
      }),
      new Promise<void>(resolve => {
        this.onStatusChange.on(() => {
          if (this.canGracefulStop()) {
            resolve();
          }
        });
      }),
    ]);
    throwIfAborted(abort);
    this.forceStop();
  }

  forceStop() {
    this._abort.abort(MANUALLY_STOP);
    this.setStatus({
      step: DocEngineStep.Stopped,
      main: null,
      shadows: this.shadows.map(() => null),
      retrying: false,
    });
  }

  // main sync process, should never return until abort
  async sync(signal: AbortSignal) {
    const state: {
      mainPeer: SyncPeer | null;
      shadowPeers: (SyncPeer | null)[];
    } = {
      mainPeer: null,
      shadowPeers: this.shadows.map(() => null),
    };

    const cleanUp: (() => void)[] = [];
    try {
      // Step 1: start main sync peer
      state.mainPeer = new SyncPeer(
        this.rootDoc,
        this.main,
        this.priorityTarget,
        this.logger
      );

      cleanUp.push(
        state.mainPeer.onStatusChange.on(() => {
          if (!signal.aborted)
            this.updateSyncingState(state.mainPeer, state.shadowPeers);
        }).dispose
      );

      this.updateSyncingState(state.mainPeer, state.shadowPeers);

      // Step 2: wait for main sync complete
      await state.mainPeer.waitForLoaded(signal);

      // Step 3: start shadow sync peer
      state.shadowPeers = this.shadows.map(shadow => {
        const peer = new SyncPeer(
          this.rootDoc,
          shadow,
          this.priorityTarget,
          this.logger
        );
        cleanUp.push(
          peer.onStatusChange.on(() => {
            if (!signal.aborted)
              this.updateSyncingState(state.mainPeer, state.shadowPeers);
          }).dispose
        );
        return peer;
      });

      this.updateSyncingState(state.mainPeer, state.shadowPeers);

      // Step 4: continuously sync main and shadow

      // wait for abort
      await new Promise((_, reject) => {
        if (signal.aborted) {
          reject(signal.reason);
        }
        signal.addEventListener('abort', () => {
          reject(signal.reason);
        });
      });
    } catch (error) {
      if (error === MANUALLY_STOP || signal.aborted) {
        return;
      }
      throw error;
    } finally {
      // stop peers
      state.mainPeer?.stop();
      for (const shadowPeer of state.shadowPeers) {
        shadowPeer?.stop();
      }
      for (const clean of cleanUp) {
        clean();
      }
    }
  }

  updateSyncingState(local: SyncPeer | null, shadows: (SyncPeer | null)[]) {
    let step = DocEngineStep.Synced;
    const allPeer = [local, ...shadows];
    for (const peer of allPeer) {
      if (!peer || peer.status.step !== DocPeerStep.Synced) {
        step = DocEngineStep.Syncing;
        break;
      }
    }
    this.setStatus({
      step,
      main: local?.status ?? null,
      shadows: shadows.map(peer => peer?.status ?? null),
      retrying: allPeer.some(
        peer => peer?.status.step === DocPeerStep.Retrying
      ),
    });
  }

  async waitForSynced(abort?: AbortSignal) {
    if (this.status.step === DocEngineStep.Synced) {
      return;
    } else {
      return Promise.race([
        new Promise<void>(resolve => {
          this.onStatusChange.on(status => {
            if (status.step === DocEngineStep.Synced) {
              resolve();
            }
          });
        }),
        new Promise((_, reject) => {
          if (abort?.aborted) {
            reject(abort?.reason);
          }
          abort?.addEventListener('abort', () => {
            reject(abort.reason);
          });
        }),
      ]);
    }
  }

  async waitForLoadedRootDoc(abort?: AbortSignal) {
    function isLoadedRootDoc(status: DocEngineStatus) {
      return ![status.main, ...status.shadows].some(
        peer => !peer || peer.step <= DocPeerStep.LoadingRootDoc
      );
    }
    if (isLoadedRootDoc(this.status)) {
      return;
    } else {
      return Promise.race([
        new Promise<void>(resolve => {
          this.onStatusChange.on(status => {
            if (isLoadedRootDoc(status)) {
              resolve();
            }
          });
        }),
        new Promise((_, reject) => {
          if (abort?.aborted) {
            reject(abort?.reason);
          }
          abort?.addEventListener('abort', () => {
            reject(abort.reason);
          });
        }),
      ]);
    }
  }

  setPriorityRule(target: ((id: string) => boolean) | null) {
    this.priorityTarget.priorityRule = target;
  }
}
