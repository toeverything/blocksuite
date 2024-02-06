import { type Logger, Slot } from '@blocksuite/global/utils';
import type { Doc } from 'yjs';

import { SharedPriorityTarget } from '../utils/async-queue.js';
import { MANUALLY_STOP, throwIfAborted } from '../utils/throw-if-aborted.js';
import { SyncEngineStep, SyncPeerStep } from './consts.js';
import { SyncPeer, type SyncPeerStatus } from './peer.js';
import { type SyncStorage } from './storage.js';

export interface SyncEngineStatus {
  step: SyncEngineStep;
  main: SyncPeerStatus | null;
  shared: (SyncPeerStatus | null)[];
  retrying: boolean;
}

/**
 * # SyncEngine
 *
 * ```
 *                    ┌────────────┐
 *                    │ SyncEngine │
 *                    └─────┬──────┘
 *                          │
 *                          ▼
 *                    ┌────────────┐
 *                    │  SyncPeer  │
 *          ┌─────────┤    main    ├─────────┐
 *          │         └─────┬──────┘         │
 *          │               │                │
 *          ▼               ▼                ▼
 *   ┌────────────┐   ┌────────────┐   ┌────────────┐
 *   │  SyncPeer  │   │  SyncPeer  │   │  SyncPeer  │
 *   │   shared   │   │   shared   │   │   shared   │
 *   └────────────┘   └────────────┘   └────────────┘
 * ```
 *
 * Sync engine manage sync peers
 *
 * Sync steps:
 * 1. start main sync
 * 2. wait for main sync complete
 * 3. start shared sync
 * 4. continuously sync main and shared
 */
export class SyncEngine {
  get rootDocId() {
    return this.rootDoc.guid;
  }

  private _status: SyncEngineStatus;
  onStatusChange = new Slot<SyncEngineStatus>();
  private set status(s: SyncEngineStatus) {
    this.logger.debug(`syne-engine:${this.rootDocId}:status change`, s);
    this._status = s;
    this.onStatusChange.emit(s);
  }

  priorityTarget = new SharedPriorityTarget();

  get status() {
    return this._status;
  }

  private abort = new AbortController();

  constructor(
    private readonly rootDoc: Doc,
    private readonly main: SyncStorage,
    private readonly shared: SyncStorage[],
    private readonly logger: Logger
  ) {
    this._status = {
      step: SyncEngineStep.Stopped,
      main: null,
      shared: shared.map(() => null),
      retrying: false,
    };
  }

  start() {
    if (this.status.step !== SyncEngineStep.Stopped) {
      this.forceStop();
    }
    this.abort = new AbortController();

    this.sync(this.abort.signal).catch(err => {
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
    this.abort.abort(MANUALLY_STOP);
    this._status = {
      step: SyncEngineStep.Stopped,
      main: null,
      shared: this.shared.map(() => null),
      retrying: false,
    };
  }

  // main sync process, should never return until abort
  async sync(signal: AbortSignal) {
    const state: {
      mainPeer: SyncPeer | null;
      sharedPeers: (SyncPeer | null)[];
    } = {
      mainPeer: null,
      sharedPeers: this.shared.map(() => null),
    };

    const cleanUp: (() => void)[] = [];
    try {
      // Step 1: start local sync peer
      state.mainPeer = new SyncPeer(
        this.rootDoc,
        this.main,
        this.priorityTarget,
        this.logger
      );

      cleanUp.push(
        state.mainPeer.onStatusChange.on(() => {
          if (!signal.aborted)
            this.updateSyncingState(state.mainPeer, state.sharedPeers);
        }).dispose
      );

      this.updateSyncingState(state.mainPeer, state.sharedPeers);

      // Step 2: wait for local sync complete
      await state.mainPeer.waitForLoaded(signal);

      // Step 3: start shared sync peer
      state.sharedPeers = this.shared.map(shared => {
        const peer = new SyncPeer(
          this.rootDoc,
          shared,
          this.priorityTarget,
          this.logger
        );
        cleanUp.push(
          peer.onStatusChange.on(() => {
            if (!signal.aborted)
              this.updateSyncingState(state.mainPeer, state.sharedPeers);
          }).dispose
        );
        return peer;
      });

      this.updateSyncingState(state.mainPeer, state.sharedPeers);

      // Step 4: continuously sync local and shared

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
      for (const sharedPeer of state.sharedPeers) {
        sharedPeer?.stop();
      }
      for (const clean of cleanUp) {
        clean();
      }
    }
  }

  updateSyncingState(local: SyncPeer | null, shared: (SyncPeer | null)[]) {
    let step = SyncEngineStep.Synced;
    const allPeer = [local, ...shared];
    for (const peer of allPeer) {
      if (!peer || peer.status.step !== SyncPeerStep.Synced) {
        step = SyncEngineStep.Syncing;
        break;
      }
    }
    this.status = {
      step,
      main: local?.status ?? null,
      shared: shared.map(peer => peer?.status ?? null),
      retrying: allPeer.some(
        peer => peer?.status.step === SyncPeerStep.Retrying
      ),
    };
  }

  async waitForSynced(abort?: AbortSignal) {
    if (this.status.step === SyncEngineStep.Synced) {
      return;
    } else {
      return Promise.race([
        new Promise<void>(resolve => {
          this.onStatusChange.on(status => {
            if (status.step === SyncEngineStep.Synced) {
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
    function isLoadedRootDoc(status: SyncEngineStatus) {
      return ![status.main, ...status.shared].some(
        peer => !peer || peer.step <= SyncPeerStep.LoadingRootDoc
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
