import type { BlockSpec, EditorHost } from '@blocksuite/block-std';
import type { DocModeService, PageRootService } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { AffineEditorContainer } from '@blocksuite/presets';
import type { BlockCollection } from '@blocksuite/store';
import type { DocCollection } from '@blocksuite/store';

import { DocsPanel } from '../../_common/components/docs-panel.js';
import { LeftSidePanel } from '../../_common/components/left-side-panel.js';
import { QuickEdgelessMenu } from '../../_common/components/quick-edgeless-menu.js';
import {
  mockDocModeService,
  mockNotificationService,
  mockQuickSearchService,
} from '../../_common/mock-services.js';
import { getExampleSpecs } from '../specs-examples/index.js';

function setDocModeFromUrlParams(service: DocModeService) {
  const params = new URLSearchParams(location.search);
  const paramMode = params.get('mode');
  if (paramMode) {
    const docMode = paramMode === 'page' ? 'page' : 'edgeless';
    service.setMode(docMode);
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

  const modeService = mockDocModeService(doc.id);
  setDocModeFromUrlParams(modeService);
  const editor = new AffineEditorContainer();
  const specs = getExampleSpecs();
  editor.pageSpecs = [...specs.pageModeSpecs].map(spec => {
    if (spec.schema.model.flavour === 'affine:page') {
      spec = patchPageRootSpec(
        spec as BlockSpec<'affine:page', PageRootService>
      );
    }
    return spec;
  });
  editor.edgelessSpecs = [...specs.edgelessModeSpecs].map(spec => {
    if (spec.schema.model.flavour === 'affine:page') {
      spec = patchPageRootSpec(
        spec as BlockSpec<'affine:page', PageRootService>
      );
    }
    return spec;
  });
  editor.doc = doc;
  editor.mode = modeService.getMode();
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

  const leftSidePanel = new LeftSidePanel();

  const docsPanel = new DocsPanel();
  docsPanel.editor = editor;

  const quickEdgelessMenu = new QuickEdgelessMenu();
  quickEdgelessMenu.collection = doc.collection;
  quickEdgelessMenu.editor = editor;
  quickEdgelessMenu.leftSidePanel = leftSidePanel;
  quickEdgelessMenu.docsPanel = docsPanel;

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

  function patchPageRootSpec(spec: BlockSpec<'affine:page', PageRootService>) {
    const setup = spec.setup;
    const newSpec: typeof spec = {
      ...spec,
      setup: (slots, disposable) => {
        setup?.(slots, disposable);
        slots.mounted.once(({ service }) => {
          const pageRootService = service as PageRootService;
          pageRootService.notificationService =
            mockNotificationService(pageRootService);
          pageRootService.quickSearchService =
            mockQuickSearchService(collection);
          pageRootService.peekViewService = {
            peek(target: unknown) {
              alert('Peek view not implemented in playground');
              console.log('peek', target);
              return Promise.resolve();
            },
          };
          pageRootService.docModeService = mockDocModeService(
            pageRootService.doc.id
          );
        });
      },
    };

    return newSpec;
  }
}
