// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';

import { AffineSchemas } from '@blocksuite/blocks';
import { AffineEditorContainer } from '@blocksuite/presets';
import { Schema } from '@blocksuite/store';
import { DocCollection, Text } from '@blocksuite/store';
import { IndexeddbPersistence } from 'y-indexeddb';

const schema = new Schema().register(AffineSchemas);
const collection = new DocCollection({ schema });
const doc = collection.createDoc();
const editor = new AffineEditorContainer();
editor.doc = doc;
document.body.append(editor);

function createDoc() {
  new IndexeddbPersistence('provider-demo', doc.spaceDoc);

  doc.load(() => {
    const pageBlockId = doc.addBlock('affine:page', {
      title: new Text('Test'),
    });
    doc.addBlock('affine:surface', {}, pageBlockId);
    const noteId = doc.addBlock('affine:note', {}, pageBlockId);
    doc.addBlock(
      'affine:paragraph',
      { text: new Text('Hello World!') },
      noteId
    );
  });
}

function loadDoc() {
  const provider = new IndexeddbPersistence('provider-demo', doc.spaceDoc);
  provider.on('synced', () => doc.load());
}

const createBtn = document.getElementById('create-doc') as HTMLButtonElement;
createBtn.onclick = () => createDoc();

const loadBtn = document.getElementById('load-doc') as HTMLButtonElement;
loadBtn.onclick = () => loadDoc();

const clearBtn = document.getElementById('clear') as HTMLButtonElement;
clearBtn.onclick = () => {
  const request = indexedDB.deleteDatabase('provider-demo');
  request.onsuccess = () => console.log('IndexedDB cleared');
};
