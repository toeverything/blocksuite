import { PDFService } from '@blocksuite/blocks';
import { __unstableSchemas } from '@blocksuite/blocks/models';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { AffineEditorContainer, CopilotPanel } from '@blocksuite/presets';
import type { Workspace } from '@blocksuite/store';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import { CustomFramePanel } from '../../_common/components/custom-frame-panel.js';
import { CustomOutlinePanel } from '../../_common/components/custom-outline-panel.js';
import { DebugMenu } from '../../_common/components/debug-menu.js';
import { DocsPanel } from '../../_common/components/docs-panel.js';
import { LeftSidePanel } from '../../_common/components/left-side-panel.js';
import { SidePanel } from '../../_common/components/side-panel.js';

const params = new URLSearchParams(location.search);
const defaultMode = params.get('mode') === 'edgeless' ? 'edgeless' : 'page';

export async function mountDefaultDocEditor(workspace: Workspace) {
  const doc = workspace.docs.values().next().value;
  assertExists(doc, 'Need to create a doc first');

  assertExists(doc.ready, 'Doc is not ready');
  assertExists(doc.root, 'Doc root is not ready');

  const app = document.getElementById('app');
  if (!app) return;

  const editor = new AffineEditorContainer();
  editor.mode = defaultMode;
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

  const outlinePanel = new CustomOutlinePanel();
  outlinePanel.editor = editor;

  const framePanel = new CustomFramePanel();
  framePanel.editor = editor;

  const copilotPanelPanel = new CopilotPanel();
  copilotPanelPanel.editor = editor;

  const sidePanel = new SidePanel();

  const leftSidePanel = new LeftSidePanel();

  const docsPanel = new DocsPanel();
  docsPanel.editor = editor;

  const debugMenu = new DebugMenu();
  debugMenu.workspace = workspace;
  debugMenu.editor = editor;
  debugMenu.outlinePanel = outlinePanel;
  debugMenu.framePanel = framePanel;
  debugMenu.copilotPanel = copilotPanelPanel;
  debugMenu.sidePanel = sidePanel;
  debugMenu.leftSidePanel = leftSidePanel;
  debugMenu.docsPanel = docsPanel;

  document.body.appendChild(outlinePanel);
  document.body.appendChild(framePanel);
  document.body.appendChild(sidePanel);
  document.body.appendChild(leftSidePanel);
  document.body.appendChild(debugMenu);

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
