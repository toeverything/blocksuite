/**
 *
 * **DocEngine**
 *
 * Manages one main Y.Doc and multiple shadow Y.Doc.
 *
 * Responsible for creating DocPeers for synchronization, following the main-first strategy.
 *
 * **DocPeer**
 *
 * Responsible for synchronizing a single Y.Doc data source with Y.Doc.
 *
 * Carries the main synchronization logic.
 *
 */

export * from './consts.js';
export * from './engine.js';
export * from './impl/index.js';
export * from './peer.js';
export * from './source.js';
