import type { AsyncCallOptions } from 'async-call-rpc';
import { AsyncCall } from 'async-call-rpc';
import { merge } from 'merge';
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';
import type { Awareness } from 'y-protocols/awareness.js';
import type { Doc } from 'yjs';

import { Workspace } from '../workspace/index.js';
import type { SubdocEvent } from '../yjs/index.js';
import type { DocProviderCreator, PassiveDocProvider } from './type.js';

const Y = Workspace.Y;

export type AwarenessChanges = Record<
  'added' | 'updated' | 'removed',
  number[]
>;

type Impl = {
  // request diff update from other clients
  diffUpdateDoc: (guid: string) => Promise<Uint8Array | false>;

  // send update to other clients
  sendUpdateDoc: (guid: string, update: Uint8Array) => Promise<void>;

  // request awareness from other clients
  queryAwareness: () => Promise<Uint8Array>;

  // send awareness to other clients
  sendAwareness: (awarenessUpdate: Uint8Array) => Promise<void>;
};

export const createAsyncCallRPCProviderCreator = <SerializationData>(
  flavour: string,
  channel: AsyncCallOptions['channel'],
  options: {
    cleanup: () => void;
    awarenessSerializer?: {
      serialization: (awareness: Awareness) => SerializationData;
      deserialization: (data: SerializationData) => Awareness;
    };
    asyncCallOptions?: Omit<AsyncCallOptions, 'channel'>;
  }
): DocProviderCreator => {
  return (id, doc, config): PassiveDocProvider => {
    const awareness = config.awareness;
    const docMap = new Map<string, Doc>();
    const cache = new Map<string, Uint8Array[]>();

    const impl = {
      diffUpdateDoc: async guid => {
        const doc = docMap.get(guid);
        if (!doc) {
          return false;
        }
        return Y.encodeStateAsUpdate(doc);
      },
      sendUpdateDoc: async (guid, update) => {
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

        rpc.sendUpdateDoc(doc.guid, update).catch(console.error);
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
          rpc.diffUpdateDoc(doc.guid).then(update => {
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

    async function registerDoc(doc: Doc) {
      initDocMap(doc);
      // register subdocs
      doc.on('subdocs', createOrGetSubdocsHandler(doc));
      doc.subdocs.forEach(registerDoc);
      // register update
      doc.on('update', createOrGetUpdateHandler(doc));
      doc.on('destroy', createOrGetDestroyHandler(doc));

      // query diff update
      const update = await rpc.diffUpdateDoc(doc.guid);
      if (!connected) {
        return;
      }
      if (update !== false) {
        Y.applyUpdate(doc, update, channel);
      }
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
      flavour: 'broadcast-channel',
      passive: true,
      connect() {
        connected = true;
        registerDoc(doc).catch(console.error);
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
