import type { DocCollection } from '@blocksuite/store';

import {
  BlockServiceWatcher,
  type EditorHost,
  type ExtensionType,
} from '@blocksuite/block-std';
import {
  AffineFormatBarWidget,
  CommunityCanvasTextFonts,
  DocModeProvider,
  FontConfigExtension,
  GenerateDocUrlExtension,
  NotificationExtension,
  OverrideThemeExtension,
  type PageRootService,
  ParseDocUrlExtension,
  RefNodeSlotsExtension,
  RefNodeSlotsProvider,
  SpecProvider,
  toolbarDefaultConfig,
} from '@blocksuite/blocks';
import { AffineEditorContainer, CommentPanel } from '@blocksuite/presets';

import { AttachmentViewerPanel } from '../../_common/components/attachment-viewer-panel.js';
import { CustomFramePanel } from '../../_common/components/custom-frame-panel.js';
import { CustomOutlinePanel } from '../../_common/components/custom-outline-panel.js';
import { CustomOutlineViewer } from '../../_common/components/custom-outline-viewer.js';
import { DocsPanel } from '../../_common/components/docs-panel.js';
import { LeftSidePanel } from '../../_common/components/left-side-panel.js';
import { SidePanel } from '../../_common/components/side-panel.js';
import { StarterDebugMenu } from '../../_common/components/starter-debug-menu.js';
import {
  getDocFromUrlParams,
  listenHashChange,
  setDocModeFromUrlParams,
} from '../../_common/history.js';
import {
  mockDocModeService,
  mockGenerateDocUrlService,
  mockNotificationService,
  mockParseDocUrlService,
  themeExtension,
} from '../../_common/mock-services';

function configureFormatBar(formatBar: AffineFormatBarWidget) {
  toolbarDefaultConfig(formatBar);
}

export async function mountDefaultDocEditor(collection: DocCollection) {
  const app = document.getElementById('app');
  if (!app) return;

  const url = new URL(location.toString());
  const doc = getDocFromUrlParams(collection, url);

  const attachmentViewerPanel = new AttachmentViewerPanel();

  const editor = new AffineEditorContainer();

  class PatchPageServiceWatcher extends BlockServiceWatcher {
    static override readonly flavour = 'affine:page';

    override mounted() {
      const pageRootService = this.blockService as PageRootService;
      const onFormatBarConnected = pageRootService.specSlots.widgetConnected.on(
        view => {
          if (view.component instanceof AffineFormatBarWidget) {
            configureFormatBar(view.component);
          }
        }
      );
      pageRootService.disposables.add(onFormatBarConnected);
    }
  }

  const refNodeSlotsExtension = RefNodeSlotsExtension();
  const extensions: ExtensionType[] = [
    refNodeSlotsExtension,
    PatchPageServiceWatcher,
    FontConfigExtension(CommunityCanvasTextFonts),
    ParseDocUrlExtension(mockParseDocUrlService(collection)),
    GenerateDocUrlExtension(mockGenerateDocUrlService(collection)),
    NotificationExtension(mockNotificationService(editor)),
    OverrideThemeExtension(themeExtension),
    {
      setup: di => {
        di.override(DocModeProvider, () =>
          mockDocModeService(getEditorModeCallback, setEditorModeCallBack)
        );
      },
    },
    // mockPeekViewExtension(attachmentViewerPanel),
  ];

  const pageSpecs = SpecProvider.getInstance().getSpec('page');
  const setEditorModeCallBack = editor.switchEditor.bind(editor);
  const getEditorModeCallback = () => editor.mode;
  pageSpecs.extend([...extensions]);
  editor.pageSpecs = pageSpecs.value;

  const edgelessSpecs = SpecProvider.getInstance().getSpec('edgeless');
  edgelessSpecs.extend([...extensions]);
  editor.edgelessSpecs = edgelessSpecs.value;

  SpecProvider.getInstance().extendSpec('edgeless:preview', [
    OverrideThemeExtension(themeExtension),
  ]);

  editor.mode = 'page';
  editor.doc = doc;
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
  const modeService = editor.std.provider.get(DocModeProvider);
  editor.mode = modeService.getPrimaryMode(doc.id);
  setDocModeFromUrlParams(modeService, url.searchParams, doc.id);
  editor.slots.docUpdated.on(({ newDocId }) => {
    editor.mode = modeService.getPrimaryMode(newDocId);
  });

  const outlinePanel = new CustomOutlinePanel();
  outlinePanel.editor = editor;

  const outlineViewer = new CustomOutlineViewer();
  outlineViewer.editor = editor;
  outlineViewer.toggleOutlinePanel = () => {
    outlinePanel.toggleDisplay();
  };

  const framePanel = new CustomFramePanel();
  framePanel.editor = editor;

  const sidePanel = new SidePanel();

  const leftSidePanel = new LeftSidePanel();

  const docsPanel = new DocsPanel();
  docsPanel.editor = editor;

  const commentPanel = new CommentPanel();
  commentPanel.editor = editor;

  const debugMenu = new StarterDebugMenu();
  debugMenu.collection = collection;
  debugMenu.editor = editor;
  debugMenu.outlinePanel = outlinePanel;
  debugMenu.outlineViewer = outlineViewer;
  debugMenu.framePanel = framePanel;
  debugMenu.sidePanel = sidePanel;
  debugMenu.leftSidePanel = leftSidePanel;
  debugMenu.docsPanel = docsPanel;
  debugMenu.commentPanel = commentPanel;

  document.body.append(attachmentViewerPanel);
  document.body.append(outlinePanel);
  document.body.append(outlineViewer);
  document.body.append(framePanel);
  document.body.append(sidePanel);
  document.body.append(leftSidePanel);
  document.body.append(debugMenu);

  // for multiple editor
  const params = new URLSearchParams(location.search);
  const init = params.get('init');
  if (init && init.startsWith('multiple-editor')) {
    app.childNodes.forEach(node => {
      if (node instanceof AffineEditorContainer) {
        node.style.flex = '1';
        if (init === 'multiple-editor-vertical') {
          node.style.overflow = 'auto';
        }
      }
    });
  }

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

  listenHashChange(collection, editor, docsPanel);

  return editor;
}
