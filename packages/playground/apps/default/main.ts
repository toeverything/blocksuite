/// <reference types="../starter/env.js" />

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';

import { mountDefaultPageEditor } from './utils/page.js';
import {
  createDefaultPageWorkspace,
  initDefaultPageWorkspace,
} from './utils/workspace.js';

async function main() {
  if (window.workspace) return;

  const workspace = createDefaultPageWorkspace();
  await initDefaultPageWorkspace(workspace);
  mountDefaultPageEditor(workspace);
}

main().catch(console.error);
