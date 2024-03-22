import type { EditorHost } from '@blocksuite/block-std';
import {
  AffineFormatBarWidget,
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
import type { DocCollection } from '@blocksuite/store';

import { CustomChatPanel } from '../../_common/components/custom-chat-panel.js';
import { CustomFramePanel } from '../../_common/components/custom-frame-panel.js';
import { CustomOutlinePanel } from '../../_common/components/custom-outline-panel.js';
import { DebugMenu } from '../../_common/components/debug-menu.js';
import { DocsPanel } from '../../_common/components/docs-panel.js';
import { LeftSidePanel } from '../../_common/components/left-side-panel.js';
import { SidePanel } from '../../_common/components/side-panel.js';

const params = new URLSearchParams(location.search);
const defaultMode = params.get('mode') === 'edgeless' ? 'edgeless' : 'page';

function configureFormatBar(formatBar: AffineFormatBarWidget) {
  toolbarDefaultConfig(formatBar);

  formatBar.addRawConfigItems(
    [affineFormatBarItemConfig, { type: 'divider' }],
    0
  );
}

export async function mountDefaultDocEditor(collection: DocCollection) {
  const doc = collection.docs.values().next().value;
  assertExists(doc, 'Need to create a doc first');

  assertExists(doc.ready, 'Doc is not ready');
  assertExists(doc.root, 'Doc root is not ready');

  const app = document.getElementById('app');
  if (!app) return;

  const editor = new AffineEditorContainer();
  editor.pageSpecs = [...PageEditorBlockSpecs].map(spec => {
    if (spec.schema.model.flavour === 'affine:page') {
      const setup = spec.setup;
      spec = {
        ...spec,
        setup: (slots, disposable) => {
          setup?.(slots, disposable);

          const onFormatBarConnected = slots.widgetConnected.on(view => {
            if (view.component instanceof AffineFormatBarWidget) {
              configureFormatBar(view.component);
            }
          });

          disposable.add(onFormatBarConnected);
        },
      };
    }
    return spec;
  });
  editor.edgelessSpecs = [...EdgelessEditorBlockSpecs].map(spec => {
    if (spec.schema.model.flavour === 'affine:page') {
      spec = {
        ...spec,
        setup: (slots, disposable) => {
          slots.mounted.once(() => {
            const onFormatBarConnected = slots.widgetConnected.on(view => {
              if (view.component instanceof AffineFormatBarWidget) {
                configureFormatBar(view.component);
              }
            });

            disposable.add(onFormatBarConnected);
          });
        },
      };
    }
    return spec;
  });
  editor.mode = defaultMode;
  editor.doc = doc;
  editor.slots.docLinkClicked.on(({ docId }) => {
    const target = collection.getDoc(docId);
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
}
