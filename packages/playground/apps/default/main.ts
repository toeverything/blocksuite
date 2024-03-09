// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';
import '../dev-format.js';

import {
  createDefaultDocCollection,
  initDefaultDocCollection,
} from './utils/collection.js';
import { mountDefaultDocEditor } from './utils/editor.js';

async function main() {
  if (window.collection) return;

  const collection = await createDefaultDocCollection();
  await initDefaultDocCollection(collection);
  await mountDefaultDocEditor(collection);
}

main().catch(console.error);
