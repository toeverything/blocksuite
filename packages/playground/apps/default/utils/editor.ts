import type { EditorHost, ExtensionType } from '@blocksuite/block-std';
import type { BlockCollection, DocCollection } from '@blocksuite/store';

import {
  CommunityCanvasTextFonts,
  DocModeExtension,
  DocModeProvider,
  FontConfigExtension,
  NotificationExtension,
  OverrideThemeExtension,
  ParseDocUrlExtension,
  RefNodeSlotsExtension,
  RefNodeSlotsProvider,
  SpecProvider,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { AffineEditorContainer } from '@blocksuite/presets';

import { AttachmentViewerPanel } from '../../_common/components/attachment-viewer-panel.js';
import { DocsPanel } from '../../_common/components/docs-panel.js';
import { LeftSidePanel } from '../../_common/components/left-side-panel.js';
import { QuickEdgelessMenu } from '../../_common/components/quick-edgeless-menu.js';
import {
  mockDocModeService,
  mockNotificationService,
  mockParseDocUrlService,
  mockPeekViewExtension,
  themeExtension,
} from '../../_common/mock-services.js';
import { getExampleSpecs } from '../specs-examples/index.js';

function setDocModeFromUrlParams(service: DocModeProvider, docId: string) {
  const params = new URLSearchParams(location.search);
  const paramMode = params.get('mode');
  if (paramMode) {
    const docMode = paramMode === 'page' ? 'page' : 'edgeless';
    service.setPrimaryMode(docMode, docId);
    service.setEditorMode(docMode);
  }
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

  const attachmentViewerPanel = new AttachmentViewerPanel();

  const editor = new AffineEditorContainer();
  const specs = getExampleSpecs();
  const refNodeSlotsExtension = RefNodeSlotsExtension();
  editor.pageSpecs = patchPageRootSpec([
    refNodeSlotsExtension,
    ...specs.pageModeSpecs,
  ]);
  editor.edgelessSpecs = patchPageRootSpec([
    refNodeSlotsExtension,
    ...specs.edgelessModeSpecs,
  ]);
  SpecProvider.getInstance().extendSpec('edgeless:preview', [
    OverrideThemeExtension(themeExtension),
  ]);
  editor.doc = doc;
  editor.mode = 'page';
  editor.std
    .get(RefNodeSlotsProvider)
    .docLinkClicked.on(({ pageId: docId }) => {
      const target = collection.getDoc(docId);
      if (!target) {
        throw new Error(`Failed to jump to doc ${docId}`);
      }
      target.load();
      editor.doc = target;
    });

  app.append(editor);
  await editor.updateComplete;
  const modeService = editor.host!.std.get(DocModeProvider);
  editor.mode = modeService.getPrimaryMode(doc.id);
  setDocModeFromUrlParams(modeService, doc.id);
  editor.slots.docUpdated.on(({ newDocId }) => {
    editor.mode = modeService.getPrimaryMode(newDocId);
  });

  const leftSidePanel = new LeftSidePanel();

  const docsPanel = new DocsPanel();
  docsPanel.editor = editor;

  const quickEdgelessMenu = new QuickEdgelessMenu();
  quickEdgelessMenu.collection = doc.collection;
  quickEdgelessMenu.editor = editor;
  quickEdgelessMenu.leftSidePanel = leftSidePanel;
  quickEdgelessMenu.docsPanel = docsPanel;

  document.body.append(attachmentViewerPanel);
  document.body.append(leftSidePanel);
  document.body.append(quickEdgelessMenu);

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

  function patchPageRootSpec(spec: ExtensionType[]) {
    const setEditorModeCallBack = editor.switchEditor.bind(editor);
    const getEditorModeCallback = () => editor.mode;
    const newSpec: typeof spec = [
      ...spec,
      DocModeExtension(
        mockDocModeService(getEditorModeCallback, setEditorModeCallBack)
      ),
      OverrideThemeExtension(themeExtension),
      ParseDocUrlExtension(mockParseDocUrlService(collection)),
      NotificationExtension(mockNotificationService(editor)),
      FontConfigExtension(CommunityCanvasTextFonts),
      mockPeekViewExtension(attachmentViewerPanel),
    ];
    return newSpec;
  }
}
