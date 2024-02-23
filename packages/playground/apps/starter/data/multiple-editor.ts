import { AffineEditorContainer } from '@blocksuite/presets';
import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils.js';

export const multiEditor: InitFn = (workspace: Workspace, id: string) => {
  const page = workspace.createPage({ id });
  page.load(() => {
    // Add page block and surface block at root level
    const pageBlockId = page.addBlock('affine:page', {
      title: new Text(),
    });

    page.addBlock('affine:surface', {}, pageBlockId);

    // Add note block inside page block
    const noteId = page.addBlock('affine:note', {}, pageBlockId);
    // Add paragraph block inside note block
    page.addBlock('affine:paragraph', {}, noteId);
  });

  page.resetHistory();

  const app = document.getElementById('app');
  if (app) {
    const editor = new AffineEditorContainer();
    editor.page = page;
    editor.slots.pageLinkClicked.on(({ pageId }) => {
      const target = workspace.getPage(pageId);
      if (!target) {
        throw new Error(`Failed to jump to page ${pageId}`);
      }
      target.load();
      editor.page = target;
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
  pageId: string
) => {
  const page = workspace.createPage({ id: pageId });
  page.load(() => {
    // Add page block and surface block at root level
    const pageBlockId = page.addBlock('affine:page', {
      title: new Text(),
    });

    page.addBlock('affine:surface', {}, pageBlockId);

    // Add note block inside page block
    const noteId = page.addBlock('affine:note', {}, pageBlockId);
    // Add paragraph block inside note block
    page.addBlock('affine:paragraph', {}, noteId);
  });

  page.resetHistory();

  const app = document.getElementById('app');
  if (app) {
    const editor = new AffineEditorContainer();
    editor.page = page;
    editor.slots.pageLinkClicked.on(({ pageId }) => {
      const target = workspace.getPage(pageId);
      if (!target) {
        throw new Error(`Failed to jump to page ${pageId}`);
      }
      target.load();
      editor.page = target;
    });
    app.append(editor);
  }
};

multiEditorVertical.id = 'multiple-editor-vertical';
multiEditorVertical.displayName = 'Vertical Multiple Editor Example';
multiEditorVertical.description = 'Multiple Editor vertical layout example';
