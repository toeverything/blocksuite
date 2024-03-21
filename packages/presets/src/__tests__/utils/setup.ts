import { AffineSchemas } from '@blocksuite/blocks/schemas';
import { assertExists } from '@blocksuite/global/utils';
import {
  type BlobStorage,
  type Doc,
  DocCollection,
  Text,
} from '@blocksuite/store';
import { createMemoryStorage, Generator, Schema } from '@blocksuite/store';

import { AffineEditorContainer } from '../../index.js';

function createCollectionOptions() {
  const blobStorages: ((id: string) => BlobStorage)[] = [];
  const schema = new Schema();
  const room = Math.random().toString(16).slice(2, 8);

  schema.register(AffineSchemas);

  const idGenerator: Generator = Generator.AutoIncrement; // works only in single user mode

  blobStorages.push(createMemoryStorage);

  return {
    id: room,
    schema,
    idGenerator,
    blobStorages,
    defaultFlags: {
      enable_synced_doc_block: true,
      enable_pie_menu: true,
      readonly: {
        'doc:home': false,
      },
    },
  };
}

function initCollection(collection: DocCollection) {
  const doc = collection.createDoc({ id: 'doc:home' });

  doc.load(() => {
    const rootId = doc.addBlock('affine:page', {
      title: new Text(),
    });
    doc.addBlock('affine:surface', {}, rootId);
  });
  doc.resetHistory();
}

async function createEditor(
  collection: DocCollection,
  mode: 'edgeless' | 'page' = 'page'
) {
  const app = document.createElement('div');
  const doc = collection.docs.values().next().value as Doc | undefined;
  assertExists(doc, 'Need to create a doc first');
  const editor = new AffineEditorContainer();
  editor.doc = doc;
  editor.mode = mode;
  app.append(editor);

  window.editor = editor;
  window.doc = doc;

  app.style.width = '100%';
  app.style.height = '1280px';

  document.body.append(app);
  await editor.updateComplete;
  return app;
}

export async function setupEditor(mode: 'edgeless' | 'page' = 'page') {
  const collection = new DocCollection(createCollectionOptions());

  window.collection = collection;

  initCollection(collection);
  const appElement = await createEditor(collection, mode);

  return () => {
    appElement.remove();
    cleanup();
  };
}

export function cleanup() {
  window.editor.remove();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).collection;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).editor;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).doc;
}
