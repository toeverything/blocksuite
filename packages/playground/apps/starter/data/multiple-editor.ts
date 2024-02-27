import { AffineEditorContainer } from '@blocksuite/presets';
import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils.js';

export const multiEditor: InitFn = (workspace: Workspace, id: string) => {
  const doc = workspace.createDoc({ id });
  doc.load(() => {
    // Add root block and surface block at root level
    const rootId = doc.addBlock('affine:page', {
      title: new Text(),
    });

    doc.addBlock('affine:surface', {}, rootId);

    // Add note block inside root block
    const noteId = doc.addBlock('affine:note', {}, rootId);
    // Add paragraph block inside note block
    doc.addBlock('affine:paragraph', {}, noteId);
  });

  doc.resetHistory();

  const app = document.getElementById('app');
  if (app) {
    const editor = new AffineEditorContainer();
    editor.doc = doc;
    editor.slots.docLinkClicked.on(({ docId }) => {
      const target = workspace.getDoc(docId);
      if (!target) {
        throw new Error(`Failed to jump to doc ${docId}`);
      }
      target.load();
      editor.doc = target;
    });

    app.append(editor);
    app.style.display = 'flex';
    app.childNodes.forEach(node => {
      if (node instanceof AffineEditorContainer) {
        node.style.flex = '1';
      }
    });
  }
};

multiEditor.id = 'multiple-editor';
multiEditor.displayName = 'Multiple Editor Example';
multiEditor.description = 'Multiple Editor basic example';

export const multiEditorVertical: InitFn = (
  workspace: Workspace,
  docId: string
) => {
  const doc = workspace.createDoc({ id: docId });
  doc.load(() => {
    // Add root block and surface block at root level
    const rootId = doc.addBlock('affine:page', {
      title: new Text(),
    });

    doc.addBlock('affine:surface', {}, rootId);

    // Add note block inside root block
    const noteId = doc.addBlock('affine:note', {}, rootId);
    // Add paragraph block inside note block
    doc.addBlock('affine:paragraph', {}, noteId);
  });

  doc.resetHistory();

  const app = document.getElementById('app');
  if (app) {
    const editor = new AffineEditorContainer();
    editor.doc = doc;
    editor.slots.docLinkClicked.on(({ docId }) => {
      const target = workspace.getDoc(docId);
      if (!target) {
        throw new Error(`Failed to jump to doc ${docId}`);
      }
      target.load();
      editor.doc = target;
    });
    app.append(editor);
  }
};

multiEditorVertical.id = 'multiple-editor-vertical';
multiEditorVertical.displayName = 'Vertical Multiple Editor Example';
multiEditorVertical.description = 'Multiple Editor vertical layout example';
