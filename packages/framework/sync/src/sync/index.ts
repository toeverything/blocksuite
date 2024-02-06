/**
 *
 * **SyncEngine**
 *
 * Manages one main storage and multiple shared storages.
 *
 * Responsible for creating SyncPeers for synchronization, following the local-first strategy.
 *
 * **SyncPeer**
 *
 * Responsible for synchronizing a single storage with Y.Doc.
 *
 * Carries the main synchronization logic.
 *
 */

export * from './consts.js';
export * from './engine.js';
export * from './peer.js';
export * from './storage.js';
