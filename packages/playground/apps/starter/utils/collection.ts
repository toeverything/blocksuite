import { AffineSchemas, TestUtils } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockCollection } from '@blocksuite/store';
import {
  type BlobStorage,
  createIndexeddbStorage,
  createMemoryStorage,
  createSimpleServerStorage,
  DocCollection,
  type DocCollectionOptions,
  Generator,
  Job,
  Schema,
  type StoreOptions,
} from '@blocksuite/store';
import {
  BroadcastChannelAwarenessSource,
  BroadcastChannelDocSource,
} from '@blocksuite/sync';

import type { InitFn } from '../data/utils.js';

const params = new URLSearchParams(location.search);
const room = params.get('room');
const blobStorageArgs = (params.get('blobStorage') ?? 'memory').split(',');
const isE2E = room?.startsWith('playwright');

export function createStarterDocCollection() {
  const blobStorages: ((id: string) => BlobStorage)[] = [];
  if (blobStorageArgs.includes('memory')) {
    blobStorages.push(createMemoryStorage);
  }
  if (blobStorageArgs.includes('idb')) {
    blobStorages.push(createIndexeddbStorage);
  }
  if (blobStorageArgs.includes('mock')) {
    blobStorages.push(createSimpleServerStorage);
  }

  const schema = new Schema();
  schema.register(AffineSchemas);
  const idGenerator = isE2E ? Generator.AutoIncrement : Generator.NanoID;

  let docSources: StoreOptions['docSources'];
  if (room) {
    docSources = {
      main: new BroadcastChannelDocSource(),
    };
  }
  const id = room ?? `starter-${Math.random().toString(16).slice(2, 8)}`;

  const options: DocCollectionOptions = {
    id,
    schema,
    idGenerator,
    blobStorages,
    defaultFlags: {
      enable_synced_doc_block: true,
      enable_pie_menu: true,
      enable_lasso_tool: true,
      enable_mindmap_entry: true,
    },
    awarenessSources: [new BroadcastChannelAwarenessSource(id)],
    docSources,
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
    await functionMap.get(init)?.(collection, 'doc:home');
    const doc = collection.getDoc('doc:home');
    if (!doc?.loaded) {
      doc?.load();
    }
    doc?.resetHistory();
  }
}
