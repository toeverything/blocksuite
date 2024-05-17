import type { EditorHost } from '@blocksuite/block-std';
import type { PageRootService } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { AffineEditorContainer } from '@blocksuite/presets';
import type { BlockCollection } from '@blocksuite/store';
import { type DocCollection } from '@blocksuite/store';

import { DocsPanel } from '../../_common/components/docs-panel.js';
import { LeftSidePanel } from '../../_common/components/left-side-panel.js';
import { QuickEdgelessMenu } from '../../_common/components/quick-edgeless-menu.js';
import { getExampleSpecs } from '../specs-examples/index.js';

const params = new URLSearchParams(location.search);
const defaultMode = params.get('mode') === 'page' ? 'page' : 'edgeless';

export async function mountDefaultDocEditor(collection: DocCollection) {
  const blockCollection = collection.docs.values().next()
    .value as BlockCollection;
  assertExists(blockCollection, 'Need to create a doc first');
  const doc = blockCollection.getDoc();

  assertExists(doc.ready, 'Doc is not ready');
  assertExists(doc.root, 'Doc root is not ready');

  const app = document.getElementById('app');
  if (!app) return;

  const editor = new AffineEditorContainer();
  const specs = getExampleSpecs();
  editor.pageSpecs = [...specs.pageModeSpecs].map(spec => {
    if (spec.schema.model.flavour === 'affine:page') {
      const setup = spec.setup;
      spec = {
        ...spec,
        setup: (slots, disposable) => {
          setup?.(slots, disposable);
          slots.mounted.once(({ service }) => {
            disposable.add(
              (<PageRootService>service).slots.editorModeSwitch.on(
                switchQuickEdgelessMenu
              )
            );
          });
        },
      };
    }
    return spec;
  });
  editor.edgelessSpecs = [...specs.edgelessModeSpecs].map(spec => {
    if (spec.schema.model.flavour === 'affine:page') {
      const setup = spec.setup;
      spec = {
        ...spec,
        setup: (slots, disposable) => {
          setup?.(slots, disposable);
          slots.mounted.once(({ service }) => {
            disposable.add(
              (<PageRootService>service).slots.editorModeSwitch.on(
                switchQuickEdgelessMenu
              )
            );
          });
        },
      };
    }
    return spec;
  });
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

  const leftSidePanel = new LeftSidePanel();

  const docsPanel = new DocsPanel();
  docsPanel.editor = editor;

  const quickEdgelessMenu = new QuickEdgelessMenu();
  quickEdgelessMenu.collection = doc.collection;
  quickEdgelessMenu.editor = editor;
  quickEdgelessMenu.mode = defaultMode;
  quickEdgelessMenu.leftSidePanel = leftSidePanel;
  quickEdgelessMenu.docsPanel = docsPanel;

  function switchQuickEdgelessMenu(mode: typeof defaultMode) {
    quickEdgelessMenu.mode = mode;
  }

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
}
