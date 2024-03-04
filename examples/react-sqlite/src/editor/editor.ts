import '@blocksuite/presets/themes/affine.css';
import { AffineEditorContainer } from '@blocksuite/presets';
import { Provider } from './provider/provider';
import { Doc } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';
import { createContext, useContext } from 'react';

export interface EditorContextType {
  editor: AffineEditorContainer | null;
  workspace: Workspace | null;
  provider: Provider | null;
  updateWorkspace: (newWorkspace: Workspace) => void;
}

export const EditorContext = createContext<EditorContextType | null>(null);

export function useEditor() {
  return useContext(EditorContext);
}

export async function initEditor() {
  const provider = await Provider.init();
  await provider.connect();

  const { workspace } = provider;
  let doc: Doc | null = null;

  workspace.docs.forEach(d => {
    doc = doc ?? d;
  });
  if (!doc) {
    throw Error('doc not found');
  }

  const editor = new AffineEditorContainer();
  editor.doc = doc;
  editor.slots.docLinkClicked.on(({ docId }) => {
    const target = workspace.getDoc(docId);
    if (!target) {
      throw new Error(`Failed to jump to doc ${docId}`);
    }
    editor.doc = target;
  });
  return { editor, provider, workspace };
}
