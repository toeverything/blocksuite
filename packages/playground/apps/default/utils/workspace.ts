import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import {
  type BlobStorage,
  createIndexeddbStorage,
  Generator,
  Job,
  Schema,
  Text,
  Workspace,
  type WorkspaceOptions,
} from '@blocksuite/store';
import { BroadcastChannelAwarenessProvider } from '@blocksuite/sync/impl/broadcast.js';
import { IndexedDBSyncStorage } from '@blocksuite/sync/impl/indexeddb.js';

import { ChannelPeer } from '../../sync/channel.js';
import { setupWebsocketChannel } from '../../sync/websocket-channel.js';

export const INDEXED_DB_NAME = 'PLAYGROUND_DB';

export async function createDefaultPageWorkspace() {
  const blobStorages: ((id: string) => BlobStorage)[] = [
    createIndexeddbStorage,
  ];
  const idGenerator: Generator = Generator.NanoID;
  const schema = new Schema();
  schema.register(AffineSchemas).register(__unstableSchemas);

  const params = new URLSearchParams(location.search);

  let websocketChannel;
  if (params.get('room')) {
    websocketChannel = new ChannelPeer(
      await setupWebsocketChannel(params.get('room') as string)
    );
  }

  const options: WorkspaceOptions = {
    id: 'quickEdgeless',
    schema,
    idGenerator,
    blobStorages,
    sync: {
      main: new IndexedDBSyncStorage(),
      shared: websocketChannel ? [websocketChannel] : [],
    },
    awareness: [new BroadcastChannelAwarenessProvider()],
    defaultFlags: {
      enable_bultin_ledits: true,
    },
  };
  const workspace = new Workspace(options);

  workspace.start();

  // debug info
  window.workspace = workspace;
  window.blockSchemas = AffineSchemas;
  window.job = new Job({ workspace });
  window.Y = Workspace.Y;

  return workspace;
}

export async function initDefaultPageWorkspace(workspace: Workspace) {
  const params = new URLSearchParams(location.search);

  await workspace.waitForSynced();

  const shouldInit = workspace.pages.size === 0 && !params.get('room');
  if (shouldInit) {
    const page = workspace.createPage({ id: 'page:home' });
    page.load();
    const pageBlockId = page.addBlock('affine:page', {
      title: new Text(),
    });
    page.addBlock('affine:surface', {}, pageBlockId);
    page.resetHistory();
  } else {
    // wait for data injected from provider
    const firstPageId =
      workspace.pages.size > 0
        ? workspace.pages.keys().next().value
        : await new Promise<string>(resolve =>
            workspace.slots.pageAdded.once(id => resolve(id))
          );
    const page = workspace.getPage(firstPageId);
    assertExists(page);
    page.load();
    // wait for data injected from provider
    if (!page.root) {
      await new Promise(resolve => page.slots.rootAdded.once(resolve));
    }
    page.resetHistory();
  }
}
