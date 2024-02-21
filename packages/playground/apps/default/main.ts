// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import 'pdfjs-dist/web/pdf_viewer.css';
import '../dev-format.js';

import { mountDefaultPageEditor, setupPDFModule } from './utils/editor.js';
import {
  createDefaultPageWorkspace,
  initDefaultPageWorkspace,
} from './utils/workspace.js';

async function main() {
  if (window.workspace) return;

  const workspace = await createDefaultPageWorkspace();
  await initDefaultPageWorkspace(workspace);
  await mountDefaultPageEditor(workspace);
  setupPDFModule();
}

main().catch(console.error);
