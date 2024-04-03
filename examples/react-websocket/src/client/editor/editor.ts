import { AffineEditorContainer } from '@blocksuite/presets';
import { Doc } from '@blocksuite/store';
import { Provider } from './provider';
import { createDoc, getCurrentRoom, setRoom } from './utils';
import '@blocksuite/presets/themes/affine.css';

export async function initEditor() {
  const editor = new AffineEditorContainer();

  // Same as .env.websocket
  const provider = await Provider.init('ws://localhost:3001');

  const { collection } = provider;

  editor.slots.docLinkClicked.on(({ docId }) => {
    provider.connect(docId);
  });

  provider.slots.docSync.on(doc => {
    doc.load();
    editor.doc = doc;
    setRoom(doc.id);
  });

  let doc: Doc | null = null;

  const currentRoom = getCurrentRoom();
  if (currentRoom) {
    doc = collection.getDoc(currentRoom);
  }

  if (doc == null) {
    collection.docs.forEach(d => {
      doc = doc ?? d;
    });
  }

  if (doc === null) {
    doc = createDoc(collection);
  }

  provider.connect(doc.id);
  editor.doc = doc;

  return { editor, collection, provider };
}
