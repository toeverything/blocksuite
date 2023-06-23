import type { EventBasedChannel } from 'async-call-rpc';
import { AsyncCall } from 'async-call-rpc';
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';
import type { Doc } from 'yjs';

import type {
  DocProviderCreator,
  PassiveDocProvider,
} from '../persistence/doc/index.js';
import { Workspace } from '../workspace/index.js';
import type { SubdocEvent } from '../yjs/index.js';

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

/**
 * BroadcastChannel support for AsyncCall.
 * Please make sure your serializer can convert JSON RPC payload into one of the following data types:
 * - Data that can be [structure cloned](http://mdn.io/structure-clone)
 */
export class BroadcastMessageChannel
  extends BroadcastChannel
  implements EventBasedChannel
{
  on(eventListener: (data: unknown) => void) {
    const f = (e: MessageEvent): void => eventListener(e.data);
    this.addEventListener('message', f);
    return () => this.removeEventListener('message', f);
  }
  send(data: any) {
    super.postMessage(data);
  }
}

const docMap = new Map<string, Doc>();

export const createBroadCastChannelProvider: DocProviderCreator = (
  id,
  doc,
  config
): PassiveDocProvider => {
  const awareness = config.awareness;
  function initDocMap(doc: Doc) {
    // register all doc into map
    docMap.set(doc.guid, doc);
    doc.subdocs.forEach(initDocMap);
  }

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
        throw new Error(`cannot find doc ${guid}`);
      }
      doc.once('subdocs', (event: SubdocEvent) => {
        event.added.forEach(doc => docMap.set(doc.guid, doc));
      });
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

  type UpdateHandler = (update: Uint8Array, origin: any) => void;

  type SubdocsHandler = (event: SubdocEvent) => void;

  const updateHandlerWeakMap = new WeakMap<Doc, UpdateHandler>();
  const subdocsHandlerWeakMap = new WeakMap<Doc, SubdocsHandler>();

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
      event.added.forEach(doc => {
        docMap.set(doc.guid, doc);
        rpc.diffUpdateDoc(doc.guid).then(update => {
          if (!update) {
            console.error('cannot get update for doc', doc.guid);
            return;
          }
          Y.applyUpdate(doc, update, broadcastChannel);
          doc.emit('load', []);
        });
        doc.on('update', createOrGetUpdateHandler(doc));
      });
    };

    subdocsHandlerWeakMap.set(doc, handler);
    return handler;
  };

  const awarenessUpdateHandler = (changes: AwarenessChanges, origin: any) => {
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

  let connected = false;
  return {
    flavour: 'broadcast-channel',
    passive: true,
    connect() {
      connected = true;

      async function registerDoc(doc: Doc) {
        initDocMap(doc);
        // register subdocs
        doc.on('subdocs', createOrGetSubdocsHandler(doc));
        doc.subdocs.forEach(registerDoc);
        // register update
        doc.on('update', createOrGetUpdateHandler(doc));

        // query diff update
        const update = await rpc.diffUpdateDoc(doc.guid);
        if (!connected) {
          return;
        }
        if (update !== false) {
          Y.applyUpdate(doc, update, broadcastChannel);
        }
      }
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
      function unregisterDoc(doc: Doc) {
        docMap.delete(doc.guid);
        doc.subdocs.forEach(unregisterDoc);
        doc.off('update', createOrGetUpdateHandler(doc));
        doc.off('subdocs', createOrGetSubdocsHandler(doc));
      }
      unregisterDoc(doc);
      awareness.off('update', awarenessUpdateHandler);
      connected = false;
    },
    get connected(): boolean {
      return connected;
    },
    cleanup: () => {
      broadcastChannel.close();
    },
  };
};
