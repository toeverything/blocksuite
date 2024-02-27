// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';
import '../dev-format.js';

import { mountDefaultDocEditor } from './utils/editor.js';
import {
  createDefaultDocWorkspace,
  initDefaultDocWorkspace,
} from './utils/workspace.js';

async function main() {
  if (window.workspace) return;

  const workspace = await createDefaultDocWorkspace();
  await initDefaultDocWorkspace(workspace);
  await mountDefaultDocEditor(workspace);
}

main().catch(console.error);
