// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import 'pdfjs-dist/web/pdf_viewer.css';
import '../dev-format.js';

import { mountDefaultDocEditor, setupPDFModule } from './utils/editor.js';
import {
  createDefaultDocWorkspace,
  initDefaultDocWorkspace,
} from './utils/workspace.js';

async function main() {
  if (window.workspace) return;

  const workspace = await createDefaultDocWorkspace();
  await initDefaultDocWorkspace(workspace);
  await mountDefaultDocEditor(workspace);
  setupPDFModule();
}

main().catch(console.error);
