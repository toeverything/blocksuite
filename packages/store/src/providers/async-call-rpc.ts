import type { AsyncCallOptions } from 'async-call-rpc';
import { AsyncCall } from 'async-call-rpc';
import { merge } from 'merge';
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';
import type { Doc } from 'yjs';

import { Workspace } from '../workspace/index.js';
import { createLazyProvider } from './lazy-provider.js';
import type {
  DatasourceDocAdapter,
  DocProviderCreator,
  LazyDocProvider,
} from './type.js';
import { getDoc } from './utils.js';

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
  return (id, rootDoc, config): LazyDocProvider => {
    const awareness = config.awareness;

    const updateHandlers = new Set<
      (guid: string, update: Uint8Array) => void
    >();

    const impl = {
      queryDocState: async (guid, targetClientId) => {
        const doc = getDoc(rootDoc, guid);
        if (!doc) {
          return false;
        }
        if (targetClientId && targetClientId !== doc.clientID) {
          return false;
        }
        return Y.encodeStateAsUpdate(doc);
      },
      sendDocUpdate: async (guid, update) => {
        updateHandlers.forEach(handler => {
          handler(guid, update);
        });
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

    const datasource: DatasourceDocAdapter = {
      queryDocState: (guid, opts) => {
        return rpc.queryDocState(guid, opts?.targetClientId);
      },
      sendDocUpdate: (guid, update) => {
        return rpc.sendDocUpdate(guid, update);
      },
      onDocUpdate: callback => {
        updateHandlers.add(callback);
        return () => {
          updateHandlers.delete(callback);
        };
      },
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

    async function initDoc(doc: Doc) {
      // query diff update
      const update = await rpc.queryDocState(doc.guid);
      if (update !== false) {
        Y.applyUpdate(doc, update, channel);
      }
    }

    const lazyProvider = createLazyProvider(rootDoc, datasource);

    return {
      flavour,
      lazy: true,
      connect(guid: string) {
        lazyProvider.connect(guid);
        if (guid === rootDoc.guid) {
          initDoc(rootDoc).catch(console.error);
          rpc
            .queryAwareness()
            .then(update => applyAwarenessUpdate(awareness, update, channel));
          awareness.on('update', awarenessUpdateHandler);
        }
      },
      disconnect(guid: string) {
        if (guid === rootDoc.guid) {
          awareness.off('update', awarenessUpdateHandler);
        }
      },
    };
  };
};
