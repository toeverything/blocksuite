import { Workspace } from '@blocksuite/store';
import type { AsyncCallOptions } from 'async-call-rpc';
import { AsyncCall } from 'async-call-rpc';
import { merge } from 'merge';
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';
import type { Doc } from 'yjs';

import type { DocProviderCreator, PassiveDocProvider } from './type.js';

export type SubdocEvent = {
  loaded: Set<Doc>;
  removed: Set<Doc>;
  added: Set<Doc>;
};

const Y = Workspace.Y;

export type AwarenessChanges = Record<
  'added' | 'updated' | 'removed',
  number[]
>;

type Impl = {
  //#region Doc
  // request diff update from other clients
  queryDocState: (
    guid: string,
    targetClientId?: number
  ) => Promise<Uint8Array | false>;

  // send update to other clients
  sendDocUpdate: (guid: string, update: Uint8Array) => Promise<void>;
  //#endregion

  //#region Awareness
  // request awareness from other clients
  queryAwareness: () => Promise<Uint8Array>;

  // send awareness to other clients
  sendAwareness: (awarenessUpdate: Uint8Array) => Promise<void>;
  //#endregion
};

export const createAsyncCallRPCProviderCreator = (
  flavour: string,
  channel: AsyncCallOptions['channel'],
  options: {
    cleanup: () => void;
    asyncCallOptions?: Omit<AsyncCallOptions, 'channel'>;
  }
): DocProviderCreator => {
  return (_id, doc, config): PassiveDocProvider => {
    const awareness = config.awareness;
    const docMap = new Map<string, Doc>();
    const cache = new Map<string, Uint8Array[]>();

    const impl = {
      queryDocState: async (guid, targetClientId) => {
        const doc = docMap.get(guid);
        if (!doc) {
          return false;
        }
        if (targetClientId && targetClientId !== doc.clientID) {
          return false;
        }
        return Y.encodeStateAsUpdate(doc);
      },
      sendDocUpdate: async (guid, update) => {
        const doc = docMap.get(guid);
        if (!doc) {
          // This case happens when the father doc is not yet updated,
          //  so that the child doc is not yet created.
          //  We need to put it into cache so that it can be applied later.
          if (!cache.has(guid)) {
            cache.set(guid, [update]);
          } else {
            (cache.get(guid) as Uint8Array[]).push(update);
          }
          return;
        }
        if (cache.has(guid)) {
          const updates = cache.get(guid) as Uint8Array[];
          updates.forEach(update => Y.applyUpdate(doc, update, channel));
          cache.delete(guid);
        }
        Y.applyUpdate(doc, update, channel);
        if (doc.store.pendingStructs) {
          for (const clientId of doc.store.pendingStructs.missing.keys()) {
            const update = await rpc.queryDocState(doc.guid, clientId);
            if (update) {
              Y.applyUpdate(doc, update, channel);
            }
          }
        }
      },
      queryAwareness: async () => {
        return encodeAwarenessUpdate(awareness, [awareness.clientID]);
      },
      sendAwareness: async awarenessUpdate => {
        applyAwarenessUpdate(awareness, awarenessUpdate, channel);
      },
    } satisfies Impl;

    const rpc = AsyncCall<Impl>(impl, {
      channel,
      ...merge(
        true,
        {
          log: {
            // only log error message
            beCalled: false,
            localError: true,
            remoteError: true,
          },
        },
        options.asyncCallOptions ?? {}
      ),
    });

    type UpdateHandler = (update: Uint8Array, origin: unknown) => void;

    type SubdocsHandler = (event: SubdocEvent) => void;
    type DestroyHandler = () => void;

    const updateHandlerWeakMap = new WeakMap<Doc, UpdateHandler>();
    const subdocsHandlerWeakMap = new WeakMap<Doc, SubdocsHandler>();
    const destroyHandlerWeakMap = new WeakMap<Doc, DestroyHandler>();

    const createOrGetUpdateHandler = (doc: Doc): UpdateHandler => {
      if (updateHandlerWeakMap.has(doc)) {
        return updateHandlerWeakMap.get(doc) as UpdateHandler;
      }
      const handler: UpdateHandler = (update, origin) => {
        if (origin === channel) {
          // not self update, ignore
          return;
        }

        rpc.sendDocUpdate(doc.guid, update).catch(console.error);
      };
      updateHandlerWeakMap.set(doc, handler);
      return handler;
    };

    const createOrGetSubdocsHandler = (doc: Doc): SubdocsHandler => {
      if (subdocsHandlerWeakMap.has(doc)) {
        return subdocsHandlerWeakMap.get(doc) as SubdocsHandler;
      }

      const handler: SubdocsHandler = event => {
        event.added.forEach(doc => docMap.set(doc.guid, doc));
        event.added.forEach(doc => {
          rpc.queryDocState(doc.guid).then(update => {
            if (!update) {
              return;
            }
            Y.applyUpdate(doc, update, channel);
            doc.emit('load', []);
          });
          doc.on('update', createOrGetUpdateHandler(doc));
        });

        event.removed.forEach(unregisterDoc);
      };

      subdocsHandlerWeakMap.set(doc, handler);
      return handler;
    };

    const createOrGetDestroyHandler = (doc: Doc): DestroyHandler => {
      if (destroyHandlerWeakMap.has(doc)) {
        return destroyHandlerWeakMap.get(doc) as DestroyHandler;
      }

      const handler: DestroyHandler = () => {
        unregisterDoc(doc);
      };

      destroyHandlerWeakMap.set(doc, handler);
      return handler;
    };

    const awarenessUpdateHandler = (
      changes: AwarenessChanges,
      origin: unknown
    ) => {
      if (origin === channel) {
        return;
      }
      const changedClients = Object.values(changes).reduce((res, cur) => [
        ...res,
        ...cur,
      ]);
      const update = encodeAwarenessUpdate(awareness, changedClients);
      rpc.sendAwareness(update).catch(console.error);
    };

    function registerDoc(doc: Doc) {
      initDocMap(doc);
      // register subdocs
      doc.on('subdocs', createOrGetSubdocsHandler(doc));
      doc.subdocs.forEach(registerDoc);
      // register update
      doc.on('update', createOrGetUpdateHandler(doc));
      doc.on('destroy', createOrGetDestroyHandler(doc));
    }

    async function initDoc(doc: Doc) {
      // query diff update
      const update = await rpc.queryDocState(doc.guid);
      if (!connected) {
        return;
      }
      if (update !== false) {
        Y.applyUpdate(doc, update, channel);
      }
      doc.subdocs.forEach(initDoc);
    }

    function unregisterDoc(doc: Doc) {
      docMap.delete(doc.guid);
      doc.subdocs.forEach(unregisterDoc);
      doc.off('update', createOrGetUpdateHandler(doc));
      doc.off('subdocs', createOrGetSubdocsHandler(doc));
      doc.off('destroy', createOrGetDestroyHandler(doc));
    }

    // recursively register all doc into map
    function initDocMap(doc: Doc) {
      // register all doc into map
      docMap.set(doc.guid, doc);
      doc.subdocs.forEach(initDocMap);
    }

    let connected = false;
    const apis = {
      flavour,
      passive: true,
      connect() {
        connected = true;
        registerDoc(doc);
        initDoc(doc).catch(console.error);
        rpc
          .queryAwareness()
          .then(update => applyAwarenessUpdate(awareness, update, channel));
        awareness.on('update', awarenessUpdateHandler);
      },
      disconnect() {
        unregisterDoc(doc);
        awareness.off('update', awarenessUpdateHandler);
        connected = false;
      },
      get connected(): boolean {
        return connected;
      },
      cleanup: () => {
        apis.disconnect();
        cache.clear();
        options.cleanup();
      },
    } as const;
    return apis;
  };
};
