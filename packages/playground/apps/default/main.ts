import { effects as blocksEffects } from '@blocksuite/blocks/effects';
import { effects as presetsEffects } from '@blocksuite/presets/effects';

import '../../style.css';
import { setupEdgelessTemplate } from '../_common/setup.js';
import '../dev-format.js';
import {
  createDefaultDocCollection,
  initDefaultDocCollection,
} from './utils/collection.js';
import { mountDefaultDocEditor } from './utils/editor.js';

blocksEffects();
presetsEffects();

async function main() {
  if (window.collection) return;

  setupEdgelessTemplate();

  const collection = await createDefaultDocCollection();
  await initDefaultDocCollection(collection);
  await mountDefaultDocEditor(collection);
}

main().catch(console.error);
