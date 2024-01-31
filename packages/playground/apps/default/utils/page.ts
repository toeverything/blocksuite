import { __unstableSchemas } from '@blocksuite/blocks/models';
import { assertExists } from '@blocksuite/global/utils';
import { AffineEditorContainer } from '@blocksuite/presets';
import type { Workspace } from '@blocksuite/store';

import { LeftSidePanel } from '../../starter/components/left-side-panel.js';
import { PagesPanel } from '../../starter/components/pages-panel.js';
import { QuickEdgelessMenu } from '../components/quick-edgeless-menu.js';
import { getExampleSpecs } from '../specs-examples/index.js';

const params = new URLSearchParams(location.search);
const defaultMode = params.get('mode') === 'page' ? 'page' : 'edgeless';

export function mountDefaultPageEditor(workspace: Workspace) {
  const page = workspace.pages.values().next().value;
  assertExists(page, 'Need to create a page first');

  assertExists(page.ready, 'Page is not ready');
  assertExists(page.root, 'Page root is not ready');

  const app = document.getElementById('app');
  if (!app) return;

  const specs = getExampleSpecs();

  const editor = new AffineEditorContainer();
  editor.docSpecs = specs.docModeSpecs;
  editor.edgelessSpecs = specs.edgelessModeSpecs;
  editor.page = page;
  editor.slots.pageLinkClicked.on(({ pageId }) => {
    const target = workspace.getPage(pageId);
    if (!target) {
      throw new Error(`Failed to jump to page ${pageId}`);
    }
    editor.page = target;
  });

  app.append(editor);

  const quickEdgelessMenu = new QuickEdgelessMenu();
  const pagesPanel = new PagesPanel();
  const leftSidePanel = new LeftSidePanel();
  quickEdgelessMenu.workspace = page.workspace;
  quickEdgelessMenu.editor = editor;
  quickEdgelessMenu.mode = defaultMode;
  quickEdgelessMenu.leftSidePanel = leftSidePanel;
  quickEdgelessMenu.pagesPanel = pagesPanel;
  document.body.appendChild(quickEdgelessMenu);
  document.body.appendChild(leftSidePanel);

  pagesPanel.editor = editor;
  window.editor = editor;
  window.page = page;

  return editor;
}
