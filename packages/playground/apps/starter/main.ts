// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';
import '../dev-format.js';

import * as blocks from '@blocksuite/blocks';
import * as globalUtils from '@blocksuite/global/utils';
import * as editor from '@blocksuite/presets';
import * as store from '@blocksuite/store';

import { mountDefaultDocEditor } from './utils/editor.js';
import {
  createStarterDocWorkspace,
  initStarterDocWorkspace,
} from './utils/workspace.js';

async function main() {
  if (window.workspace) return;

  const params = new URLSearchParams(location.search);
  const room = params.get('room') ?? Math.random().toString(16).slice(2, 8);
  const isE2E = room.startsWith('playwright');
  const workspace = createStarterDocWorkspace();

  if (isE2E) {
    Object.defineProperty(window, '$blocksuite', {
      value: Object.freeze({
        store,
        blocks,
        global: { utils: globalUtils },
        editor,
      }),
    });
    return;
  }

  await initStarterDocWorkspace(workspace);
  await mountDefaultDocEditor(workspace);
}

main().catch(console.error);
