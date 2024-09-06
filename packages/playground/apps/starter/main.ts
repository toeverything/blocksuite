import {
  WidgetViewMapExtension,
  WidgetViewMapIdentifier,
} from '@blocksuite/block-std';
import * as blocks from '@blocksuite/blocks';
import {
  CommunityCanvasTextFonts,
  DocModeProvider,
  FontConfigExtension,
  QuickSearchProvider,
} from '@blocksuite/blocks';
import * as globalUtils from '@blocksuite/global/utils';
import * as editor from '@blocksuite/presets';
import '@blocksuite/presets/themes/affine.css';
import * as store from '@blocksuite/store';

import { mockDocModeService } from '../_common/mock-services.js';
import { setupEdgelessTemplate } from '../_common/setup.js';
import '../dev-format.js';
import {
  createStarterDocCollection,
  initStarterDocCollection,
} from './utils/collection.js';
import { mountDefaultDocEditor } from './utils/editor.js';

async function main() {
  if (window.collection) return;

  setupEdgelessTemplate();

  const params = new URLSearchParams(location.search);
  const room = params.get('room') ?? Math.random().toString(16).slice(2, 8);
  const isE2E = room.startsWith('playwright');
  const collection = createStarterDocCollection();

  if (isE2E) {
    Object.defineProperty(window, '$blocksuite', {
      value: Object.freeze({
        store,
        blocks,
        global: { utils: globalUtils },
        editor,
        identifiers: {
          WidgetViewMapIdentifier,
          QuickSearchProvider,
          DocModeProvider,
        },
        extensions: {
          FontConfigExtension: FontConfigExtension(CommunityCanvasTextFonts),
          WidgetViewMapExtension,
        },
        mockServices: {
          mockDocModeService,
        },
      }),
    });

    // test if blocksuite can run in a web worker, SEE: tests/worker.spec.ts
    // window.testWorker = new Worker(
    //   new URL('./utils/test-worker.ts', import.meta.url),
    //   {
    //     type: 'module',
    //   }
    // );

    return;
  }

  await initStarterDocCollection(collection);
  await mountDefaultDocEditor(collection);
}

main().catch(console.error);
