import { AffineEditorContainer } from '@blocksuite/presets';
import { Doc, Schema } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';
import { createContext, useContext } from 'react';
import { AffineSchemas } from '@blocksuite/blocks';
import '@blocksuite/presets/themes/affine.css';

export interface EditorContextType {
  editor: AffineEditorContainer | null;
  workspace: Workspace | null;
  updateWorkspace: (newWorkspace: Workspace) => void;
}

export const EditorContext = createContext<EditorContextType | null>(null);

export function useEditor() {
  return useContext(EditorContext);
}

export function initEditor() {
  const schema = new Schema().register(AffineSchemas);
  const workspace = new Workspace({ schema });
  const doc = workspace.createDoc({ id: 'page1' });

  doc.load(() => {
    const pageBlockId = doc.addBlock('affine:page', {});
    doc.addBlock('affine:surface', {}, pageBlockId);
    const noteId = doc.addBlock('affine:note', {}, pageBlockId);
    doc.addBlock('affine:paragraph', {}, noteId);
  });

  const editor = new AffineEditorContainer();
  editor.doc = doc;
  editor.slots.docLinkClicked.on(({ docId }) => {
    const target = <Doc>workspace.getDoc(docId);
    editor.doc = target;
  });
  return { editor, workspace };
}
