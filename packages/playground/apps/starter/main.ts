// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';
import '../dev-format.js';

import * as blocks from '@blocksuite/blocks';
import * as globalUtils from '@blocksuite/global/utils';
import * as editor from '@blocksuite/presets';
import * as store from '@blocksuite/store';

import { mountDefaultPageEditor } from './utils/editor.js';
import {
  createStarterPageWorkspace,
  initStarterPageWorkspace,
} from './utils/workspace.js';

async function main() {
  if (window.workspace) return;

  const params = new URLSearchParams(location.search);
  const room = params.get('room') ?? Math.random().toString(16).slice(2, 8);
  const isE2E = room.startsWith('playwright');
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

  const workspace = createStarterPageWorkspace();
  await initStarterPageWorkspace(workspace);
  await mountDefaultPageEditor(workspace);
}

main().catch(console.error);
