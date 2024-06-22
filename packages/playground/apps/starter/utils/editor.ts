import type { BlockSpec, EditorHost } from '@blocksuite/block-std';
import type { DocModeService, PageRootService } from '@blocksuite/blocks';
import {
  AffineFormatBarWidget,
  createDocModeService,
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
  toolbarDefaultConfig,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import {
  AffineEditorContainer,
  affineFormatBarItemConfig,
  CommentPanel,
  CopilotPanel,
} from '@blocksuite/presets';
import type { BlockCollection } from '@blocksuite/store';
import type { DocCollection } from '@blocksuite/store';

import { CustomChatPanel } from '../../_common/components/custom-chat-panel.js';
import { CustomFramePanel } from '../../_common/components/custom-frame-panel.js';
import { CustomOutlinePanel } from '../../_common/components/custom-outline-panel.js';
import { DebugMenu } from '../../_common/components/debug-menu.js';
import { DocsPanel } from '../../_common/components/docs-panel.js';
import { LeftSidePanel } from '../../_common/components/left-side-panel.js';
import { SidePanel } from '../../_common/components/side-panel.js';
import {
  mockNotificationService,
  mockQuickSearchService,
} from '../../_common/mock-services.js';

function setDocModeFromUrlParams(service: DocModeService) {
  const params = new URLSearchParams(location.search);
  const paramMode = params.get('mode');
  if (paramMode) {
    const docMode = paramMode === 'page' ? 'page' : 'edgeless';
    service.setMode(docMode);
  }
}

function configureFormatBar(formatBar: AffineFormatBarWidget) {
  toolbarDefaultConfig(formatBar);

  formatBar.addRawConfigItems(
    [affineFormatBarItemConfig, { type: 'divider' }],
    0
  );
}

export async function mountDefaultDocEditor(collection: DocCollection) {
  const blockCollection = collection.docs.values().next()
    .value as BlockCollection;
  assertExists(blockCollection, 'Need to create a doc first');
  const doc = blockCollection.getDoc();

  assertExists(doc.ready, 'Doc is not ready');
  assertExists(doc.root, 'Doc root is not ready');

  const app = document.getElementById('app');
  if (!app) return;

  const modeService = createDocModeService(doc.id);
  setDocModeFromUrlParams(modeService);
  const editor = new AffineEditorContainer();
  editor.pageSpecs = [...PageEditorBlockSpecs].map(spec => {
    if (spec.schema.model.flavour === 'affine:page') {
      spec = patchPageRootSpec(
        spec as BlockSpec<'affine:page', PageRootService>
      );
    }
    return spec;
  });
  editor.edgelessSpecs = [...EdgelessEditorBlockSpecs].map(spec => {
    if (spec.schema.model.flavour === 'affine:page') {
      spec = patchPageRootSpec(
        spec as BlockSpec<'affine:page', PageRootService>
      );
    }
    return spec;
  });
  editor.mode = modeService.getMode();
  editor.doc = doc;
  editor.slots.docLinkClicked.on(({ docId }) => {
    const target = collection.getDoc(docId);
    if (!target) {
      throw new Error(`Failed to jump to doc ${docId}`);
    }
    target.load();
    editor.doc = target;
  });
  editor.slots.docUpdated.on(({ newDocId }) => {
    editor.mode = modeService.getMode(newDocId);
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

  const commentPanel = new CommentPanel();
  commentPanel.host = editor.host;

  const chatPanel = new CustomChatPanel();
  chatPanel.editor = editor;

  const debugMenu = new DebugMenu();
  debugMenu.collection = collection;
  debugMenu.editor = editor;
  debugMenu.outlinePanel = outlinePanel;
  debugMenu.framePanel = framePanel;
  debugMenu.copilotPanel = copilotPanelPanel;
  debugMenu.sidePanel = sidePanel;
  debugMenu.leftSidePanel = leftSidePanel;
  debugMenu.docsPanel = docsPanel;
  debugMenu.commentPanel = commentPanel;
  debugMenu.chatPanel = chatPanel;

  document.body.append(outlinePanel);
  document.body.append(framePanel);
  document.body.append(sidePanel);
  document.body.append(leftSidePanel);
  document.body.append(debugMenu);
  document.body.append(chatPanel);

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

  function patchPageRootSpec(spec: BlockSpec<'affine:page', PageRootService>) {
    const setup = spec.setup;
    const newSpec: typeof spec = {
      ...spec,
      setup: (slots, disposable) => {
        setup?.(slots, disposable);
        slots.mounted.once(({ service }) => {
          const pageRootService = service as PageRootService;
          const onFormatBarConnected = slots.widgetConnected.on(view => {
            if (view.component instanceof AffineFormatBarWidget) {
              configureFormatBar(view.component);
            }
          });
          disposable.add(onFormatBarConnected);
          pageRootService.notificationService =
            mockNotificationService(pageRootService);
          pageRootService.quickSearchService =
            mockQuickSearchService(collection);
        });
      },
    };

    return newSpec;
  }
}
