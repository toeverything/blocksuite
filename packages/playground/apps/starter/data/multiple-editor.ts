import { EditorContainer } from '@blocksuite/editor';
import { Text, type Workspace } from '@blocksuite/store';

import { createEditor } from '../utils';
import { type InitFn } from './utils';

export const multiEditor: InitFn = async (workspace: Workspace, id: string) => {
  const page = workspace.createPage({ id });
  await page.waitForLoaded();

  // Add page block and surface block at root level
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text(),
  });

  page.addBlock('affine:surface', {}, pageBlockId);

  // Add note block inside page block
  const noteId = page.addBlock('affine:note', {}, pageBlockId);
  // Add paragraph block inside note block
  page.addBlock('affine:paragraph', {}, noteId);
  page.resetHistory();

  const app = document.getElementById('app');
  if (app) {
    createEditor(page, app);
    app.style.display = 'flex';
    app.childNodes.forEach(node => {
      if (node instanceof EditorContainer) {
        node.style.flex = '1';
      }
    });
  }
};

multiEditor.id = 'multiple-editor';
multiEditor.displayName = 'Multiple Editor Example';
multiEditor.description = 'Multiple Editor basic example';

export const multiEditorVertical: InitFn = async (
  workspace: Workspace,
  pageId: string
) => {
  const page = workspace.createPage({ id: pageId });
  await page.waitForLoaded();

  // Add page block and surface block at root level
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text(),
  });

  page.addBlock('affine:surface', {}, pageBlockId);

  // Add note block inside page block
  const noteId = page.addBlock('affine:note', {}, pageBlockId);
  // Add paragraph block inside note block
  page.addBlock('affine:paragraph', {}, noteId);
  page.resetHistory();

  const app = document.getElementById('app');
  if (app) {
    createEditor(page, app);
  }
};

multiEditorVertical.id = 'multiple-editor-vertical';
multiEditorVertical.displayName = 'Vertical Multiple Editor Example';
multiEditorVertical.description = 'Multiple Editor vertical layout example';
