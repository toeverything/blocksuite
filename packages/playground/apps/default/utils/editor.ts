import { __unstableSchemas } from '@blocksuite/blocks/models';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { AffineEditorContainer } from '@blocksuite/presets';
import type { Workspace } from '@blocksuite/store';

import { LeftSidePanel } from '../../_common/components/left-side-panel.js';
import { PagesPanel } from '../../_common/components/pages-panel.js';
import { QuickEdgelessMenu } from '../../_common/components/quick-edgeless-menu.js';
import { getExampleSpecs } from '../specs-examples/index.js';

const params = new URLSearchParams(location.search);
const defaultMode = params.get('mode') === 'page' ? 'page' : 'edgeless';

export async function mountDefaultPageEditor(workspace: Workspace) {
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
    target.load();
    editor.page = target;
  });

  app.append(editor);
  await editor.updateComplete;

  const leftSidePanel = new LeftSidePanel();

  const pagesPanel = new PagesPanel();
  pagesPanel.editor = editor;

  const quickEdgelessMenu = new QuickEdgelessMenu();
  quickEdgelessMenu.workspace = page.workspace;
  quickEdgelessMenu.editor = editor;
  quickEdgelessMenu.mode = defaultMode;
  quickEdgelessMenu.leftSidePanel = leftSidePanel;
  quickEdgelessMenu.pagesPanel = pagesPanel;

  document.body.appendChild(leftSidePanel);
  document.body.appendChild(quickEdgelessMenu);

  // debug info
  window.editor = editor;
  window.page = page;
  Object.defineProperty(globalThis, 'host', {
    get() {
      return document.querySelector<EditorHost>('editor-host');
    },
  });
  Object.defineProperty(globalThis, 'std', {
    get() {
      return document.querySelector<EditorHost>('editor-host')?.std;
    },
  });

  return editor;
}
