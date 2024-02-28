import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import {
  type BlobStorage,
  createIndexeddbStorage,
  Generator,
  Job,
  Schema,
  type StoreOptions,
  Text,
  Workspace,
  type WorkspaceOptions,
} from '@blocksuite/store';
import { IndexedDBDocSource } from '@blocksuite/sync';

import { WebSocketAwarenessSource } from '../../_common/sync/websocket/awareness';
import { WebSocketDocSource } from '../../_common/sync/websocket/doc';

const BASE_WEBSOCKET_URL = new URL(import.meta.env.PLAYGROUND_WS);

export const INDEXED_DB_NAME = 'PLAYGROUND_DB';

export async function createDefaultDocWorkspace() {
  const blobStorages: ((id: string) => BlobStorage)[] = [
    createIndexeddbStorage,
  ];
  const idGenerator: Generator = Generator.NanoID;
  const schema = new Schema();
  schema.register(AffineSchemas).register(__unstableSchemas);

  const params = new URLSearchParams(location.search);
  let docSources: StoreOptions['docSources'] = {
    main: new IndexedDBDocSource(),
  };
  let awarenessSources: StoreOptions['awarenessSources'];
  const room = params.get('room');
  if (room) {
    const ws = new WebSocket(new URL(`/room/${room}`, BASE_WEBSOCKET_URL));
    await new Promise(resolve => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', resolve);
    });
    docSources = {
      main: new IndexedDBDocSource(),
      shadow: [new WebSocketDocSource(ws)],
    };
    awarenessSources = [new WebSocketAwarenessSource(ws)];
  }

  const options: WorkspaceOptions = {
    id: 'quickEdgeless',
    schema,
    idGenerator,
    blobStorages,
    docSources,
    awarenessSources,
    defaultFlags: {
      enable_synced_doc_block: true,
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

export async function initDefaultDocWorkspace(workspace: Workspace) {
  const params = new URLSearchParams(location.search);

  await workspace.waitForSynced();

  const shouldInit = workspace.docs.size === 0 && !params.get('room');
  if (shouldInit) {
    const doc = workspace.createDoc({ id: 'doc:home' });
    doc.load();
    const rootId = doc.addBlock('affine:page', {
      title: new Text(),
    });
    doc.addBlock('affine:surface', {}, rootId);
    doc.resetHistory();
  } else {
    // wait for data injected from provider
    const firstPageId =
      workspace.docs.size > 0
        ? workspace.docs.keys().next().value
        : await new Promise<string>(resolve =>
            workspace.slots.docAdded.once(id => resolve(id))
          );
    const doc = workspace.getDoc(firstPageId);
    assertExists(doc);
    doc.load();
    // wait for data injected from provider
    if (!doc.root) {
      await new Promise(resolve => doc.slots.rootAdded.once(resolve));
    }
    doc.resetHistory();
  }
}
