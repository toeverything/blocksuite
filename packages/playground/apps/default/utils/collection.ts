import type { BlockSuiteFlags } from '@blocksuite/global/types';

import { AffineSchemas } from '@blocksuite/blocks';
import {
  DocCollection,
  type DocCollectionOptions,
  IdGeneratorType,
  Job,
  Schema,
  Text,
} from '@blocksuite/store';
import {
  BroadcastChannelAwarenessSource,
  BroadcastChannelDocSource,
  IndexedDBBlobSource,
  IndexedDBDocSource,
} from '@blocksuite/sync';

import { WebSocketAwarenessSource } from '../../_common/sync/websocket/awareness';
import { WebSocketDocSource } from '../../_common/sync/websocket/doc';

const BASE_WEBSOCKET_URL = new URL(import.meta.env.PLAYGROUND_WS);

export async function createDefaultDocCollection() {
  const idGenerator: IdGeneratorType = IdGeneratorType.NanoID;
  const schema = new Schema();
  schema.register(AffineSchemas);

  const params = new URLSearchParams(location.search);
  let docSources: DocCollectionOptions['docSources'] = {
    main: new IndexedDBDocSource(),
  };
  let awarenessSources: DocCollectionOptions['awarenessSources'];
  const room = params.get('room');
  if (room) {
    const ws = new WebSocket(new URL(`/room/${room}`, BASE_WEBSOCKET_URL));
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    })
      .then(() => {
        docSources = {
          main: new IndexedDBDocSource(),
          shadows: [new WebSocketDocSource(ws)],
        };
        awarenessSources = [new WebSocketAwarenessSource(ws)];
      })
      .catch(() => {
        docSources = {
          main: new IndexedDBDocSource(),
          shadows: [new BroadcastChannelDocSource()],
        };
        awarenessSources = [
          new BroadcastChannelAwarenessSource('collabPlayground'),
        ];
      });
  }

  const flags: Partial<BlockSuiteFlags> = Object.fromEntries(
    [...params.entries()]
      .filter(([key]) => key.startsWith('enable_'))
      .map(([k, v]) => [k, v === 'true'])
  );

  const options: DocCollectionOptions = {
    id: 'collabPlayground',
    schema,
    idGenerator,
    blobSources: {
      main: new IndexedDBBlobSource('collabPlayground'),
    },
    docSources,
    awarenessSources,
    defaultFlags: {
      enable_synced_doc_block: true,
      enable_pie_menu: true,
      enable_lasso_tool: true,
      enable_color_picker: true,
      ...flags,
    },
  };
  const collection = new DocCollection(options);
  collection.start();

  // debug info
  window.collection = collection;
  window.blockSchemas = AffineSchemas;
  window.job = new Job({ collection });
  window.Y = DocCollection.Y;

  return collection;
}

export async function initDefaultDocCollection(collection: DocCollection) {
  const params = new URLSearchParams(location.search);

  await collection.waitForSynced();

  const shouldInit = collection.docs.size === 0 && !params.get('room');
  if (shouldInit) {
    collection.meta.initialize();
    const doc = collection.createDoc({ id: 'doc:home' });
    doc.load();
    const rootId = doc.addBlock('affine:page', {
      title: new Text(),
    });
    doc.addBlock('affine:surface', {}, rootId);
    doc.resetHistory();
  }
}
