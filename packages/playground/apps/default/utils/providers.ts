import type { Workspace } from '@blocksuite/store';
import { createIndexedDBProvider } from '@toeverything/y-indexeddb';

import { initCollaborationSocket } from '../providers/websocket-channel.js';

export const INDEXED_DB_NAME = 'PLAYGROUND_DB';

declare global {
  interface Window {
    providers: {
      idb?: unknown;
      rpc?: unknown;
    };
  }
}
window.providers = {};

export async function setupProviders(workspace: Workspace) {
  const params = new URLSearchParams(location.search);
  if (params.get('room')) {
    await initCollaborationSocket(workspace, params.get('room') as string);
  } else {
    const indexedDBProvider = createIndexedDBProvider(
      workspace.doc,
      INDEXED_DB_NAME
    );
    indexedDBProvider.connect();
    window.providers.idb = indexedDBProvider;
  }
}

export async function testIDBExistence() {
  return new Promise<boolean>(resolve => {
    const request = indexedDB.open(INDEXED_DB_NAME);
    request.onupgradeneeded = function () {
      request.transaction?.abort();
      request.result.close();
      resolve(false);
    };
    request.onsuccess = function () {
      request.result.close();
      resolve(true);
    };
  });
}
