import type { BlockSuiteFlags } from '@blocksuite/global/types';

import { AffineSchemas, TestUtils } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import {
  type BlockCollection,
  DocCollection,
  type DocCollectionOptions,
  IdGeneratorType,
  Job,
  Schema,
} from '@blocksuite/store';
import {
  type BlobSource,
  BroadcastChannelAwarenessSource,
  BroadcastChannelDocSource,
  IndexedDBBlobSource,
  MemoryBlobSource,
} from '@blocksuite/sync';

import type { InitFn } from '../data/utils.js';

import { MockServerBlobSource } from '../../_common/sync/blob/mock-server.js';

const params = new URLSearchParams(location.search);
const room = params.get('room');
const isE2E = room?.startsWith('playwright');
const blobSourceArgs = (params.get('blobSource') ?? '').split(',');

export function createStarterDocCollection() {
  const collectionId = room ?? 'starter';
  const schema = new Schema();
  schema.register(AffineSchemas);
  const idGenerator = isE2E
    ? IdGeneratorType.AutoIncrement
    : IdGeneratorType.NanoID;

  let docSources: DocCollectionOptions['docSources'];
  if (room) {
    docSources = {
      main: new BroadcastChannelDocSource(`broadcast-channel-${room}`),
    };
  }
  const id = room ?? `starter-${Math.random().toString(16).slice(2, 8)}`;

  const blobSources = {
    main: new MemoryBlobSource(),
    shadows: [] as BlobSource[],
  } satisfies DocCollectionOptions['blobSources'];
  if (blobSourceArgs.includes('mock')) {
    blobSources.shadows.push(new MockServerBlobSource(collectionId));
  }
  if (blobSourceArgs.includes('idb')) {
    blobSources.shadows.push(new IndexedDBBlobSource(collectionId));
  }

  const flags: Partial<BlockSuiteFlags> = Object.fromEntries(
    [...params.entries()]
      .filter(([key]) => key.startsWith('enable_'))
      .map(([k, v]) => [k, v === 'true'])
  );

  const options: DocCollectionOptions = {
    id: collectionId,
    schema,
    idGenerator,
    defaultFlags: {
      enable_synced_doc_block: true,
      enable_pie_menu: true,
      enable_lasso_tool: true,
      enable_edgeless_text: true,
      enable_color_picker: true,
      enable_mind_map_import: true,
      enable_advanced_block_visibility: true,
      ...flags,
    },
    awarenessSources: [new BroadcastChannelAwarenessSource(id)],
    docSources,
    blobSources,
  };
  const collection = new DocCollection(options);
  collection.start();

  // debug info
  window.collection = collection;
  window.blockSchemas = AffineSchemas;
  window.job = new Job({ collection: collection });
  window.Y = DocCollection.Y;
  window.testUtils = new TestUtils();

  return collection;
}

export async function initStarterDocCollection(collection: DocCollection) {
  // init from other clients
  if (room && !params.has('init')) {
    const firstCollection = collection.docs.values().next().value as
      | BlockCollection
      | undefined;
    let firstDoc = firstCollection?.getDoc();
    if (!firstDoc) {
      await new Promise<string>(resolve =>
        collection.slots.docAdded.once(resolve)
      );
      const firstCollection = collection.docs.values().next().value as
        | BlockCollection
        | undefined;
      firstDoc = firstCollection?.getDoc();
    }
    assertExists(firstDoc);
    const doc = firstDoc;

    doc.load();
    if (!doc.root) {
      await new Promise(resolve => doc.slots.rootAdded.once(resolve));
    }
    doc.resetHistory();
    return;
  }

  // use built-in init function
  const functionMap = new Map<
    string,
    (collection: DocCollection, id: string) => Promise<void> | void
  >();
  Object.values(
    (await import('../data/index.js')) as Record<string, InitFn>
  ).forEach(fn => functionMap.set(fn.id, fn));
  const init = params.get('init') || 'preset';
  if (functionMap.has(init)) {
    collection.meta.initialize();
    await functionMap.get(init)?.(collection, 'doc:home');
    const doc = collection.getDoc('doc:home');
    if (!doc?.loaded) {
      doc?.load();
    }
    doc?.resetHistory();
  }
}
