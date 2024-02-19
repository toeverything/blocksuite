// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';
import '../dev-format.js';

import { mountDefaultPageEditor } from './utils/editor.js';
import {
  createDefaultPageWorkspace,
  initDefaultPageWorkspace,
} from './utils/workspace.js';

async function main() {
  if (window.workspace) return;

  const workspace = await createDefaultPageWorkspace();
  await initDefaultPageWorkspace(workspace);
  await mountDefaultPageEditor(workspace);
}

main().catch(console.error);
