import { PDFService } from '@blocksuite/blocks';
import { __unstableSchemas } from '@blocksuite/blocks/models';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { AffineEditorContainer } from '@blocksuite/presets';
import type { Workspace } from '@blocksuite/store';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import { DocsPanel } from '../../_common/components/docs-panel.js';
import { LeftSidePanel } from '../../_common/components/left-side-panel.js';
import { QuickEdgelessMenu } from '../../_common/components/quick-edgeless-menu.js';
import { getExampleSpecs } from '../specs-examples/index.js';

const params = new URLSearchParams(location.search);
const defaultMode = params.get('mode') === 'page' ? 'page' : 'edgeless';

export async function mountDefaultDocEditor(workspace: Workspace) {
  const doc = workspace.docs.values().next().value;
  assertExists(doc, 'Need to create a doc first');

  assertExists(doc.ready, 'Doc is not ready');
  assertExists(doc.root, 'Doc root is not ready');

  const app = document.getElementById('app');
  if (!app) return;

  const specs = getExampleSpecs();

  const editor = new AffineEditorContainer();
  editor.pageSpecs = specs.pageModeSpecs;
  editor.edgelessSpecs = specs.edgelessModeSpecs;
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
  await editor.updateComplete;

  const leftSidePanel = new LeftSidePanel();

  const docsPanel = new DocsPanel();
  docsPanel.editor = editor;

  const quickEdgelessMenu = new QuickEdgelessMenu();
  quickEdgelessMenu.workspace = doc.workspace;
  quickEdgelessMenu.editor = editor;
  quickEdgelessMenu.mode = defaultMode;
  quickEdgelessMenu.leftSidePanel = leftSidePanel;
  quickEdgelessMenu.docsPanel = docsPanel;

  document.body.appendChild(leftSidePanel);
  document.body.appendChild(quickEdgelessMenu);

  // debug info
  window.editor = editor;
  window.doc = doc;
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

export function setupPDFModule() {
  PDFService.setPDFModule([
    () => import('pdfjs-dist'),
    () => import('pdfjs-dist/web/pdf_viewer.mjs').then(m => m.TextLayerBuilder),
    pdfWorkerSrc,
  ]);
}
