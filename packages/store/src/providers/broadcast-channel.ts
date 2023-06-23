import { AsyncCall } from 'async-call-rpc';
import { BroadcastMessageChannel } from 'async-call-rpc/utils/web/broadcast.channel.js';
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';
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
  queryAwareness: () => Promise<Uint8Array | false>;

  // send awareness to other clients
  sendAwareness: (awarenessUpdate: Uint8Array) => Promise<void>;
};

export const createBroadcastChannelProvider: DocProviderCreator = (
  id,
  doc,
  config
): PassiveDocProvider => {
  const awareness = config.awareness;
  const docMap = new Map<string, Doc>();

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
        // fixme: use batch update
        //  this might because the father doc is not updated yet,
        //  so that the subdoc is not created yet.
        //
        setTimeout(() => impl.sendUpdateDoc(guid, update), 100);
        return;
      }
      Y.applyUpdate(doc, update);
    },
    queryAwareness: async () => {
      return encodeAwarenessUpdate(awareness, [awareness.clientID]);
    },
    sendAwareness: async awarenessUpdate => {
      applyAwarenessUpdate(awareness, awarenessUpdate, broadcastChannel);
    },
  } satisfies Impl;

  const broadcastChannel = new BroadcastMessageChannel(id);
  const rpc = AsyncCall<Impl>(impl, {
    channel: broadcastChannel,
    log: {
      // only log error message
      beCalled: false,
      localError: true,
      remoteError: true,
    },
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
      if (origin === broadcastChannel) {
        // not self update, ignore
        return;
      }

      doc.subdocs.forEach(doc => {
        docMap.set(doc.guid, doc);
      });

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
          Y.applyUpdate(doc, update, broadcastChannel);
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
    if (origin === broadcastChannel) {
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
      Y.applyUpdate(doc, update, broadcastChannel);
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
        .then(
          update =>
            update && applyAwarenessUpdate(awareness, update, broadcastChannel)
        );
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
      broadcastChannel.close();
    },
  } as const;
  return apis;
};
