import { AffineEditorContainer } from '@blocksuite/presets';
import { Provider } from './provider/provider';
import { Doc } from '@blocksuite/store';
import { DocCollection } from '@blocksuite/store';
import { createContext, useContext } from 'react';
import '@blocksuite/presets/themes/affine.css';

export interface EditorContextType {
  editor: AffineEditorContainer | null;
  collection: DocCollection | null;
  provider: Provider | null;
  updateCollection: (newCollection: DocCollection) => void;
}

export const EditorContext = createContext<EditorContextType | null>(null);

export function useEditor() {
  return useContext(EditorContext);
}

export async function initEditor() {
  const provider = await Provider.init();
  await provider.connect();

  const { collection: collection } = provider;
  let doc: Doc | null = null;

  collection.docs.forEach(d => {
    doc = doc ?? d;
  });
  if (!doc) {
    throw Error('doc not found');
  }

  const editor = new AffineEditorContainer();
  editor.doc = doc;
  editor.slots.docLinkClicked.on(({ docId }) => {
    const target = <Doc>collection.getDoc(docId);
    editor.doc = target;
  });
  return { editor, provider, collection };
}
