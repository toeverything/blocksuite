import { AffineEditorContainer } from '@blocksuite/presets';
import { CollectionProvider } from './provider/provider';
import { Doc } from '@blocksuite/store';
import '@blocksuite/presets/themes/affine.css';

export async function initEditor() {
  const provider = await CollectionProvider.init();

  const { collection } = provider;
  const editor = new AffineEditorContainer();

  editor.doc = [...collection.docs.values()][0];
  editor.slots.docLinkClicked.on(({ docId }) => {
    const target = <Doc>collection.getDoc(docId);
    editor.doc = target;
  });
  return { editor, provider, collection };
}
