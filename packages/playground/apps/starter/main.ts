import '../../style.css';

import * as blockStd from '@blocksuite/affine/block-std';
import * as databaseBlocks from '@blocksuite/affine/blocks/database';
import * as noteBlocks from '@blocksuite/affine/blocks/note';
import { effects as blocksEffects } from '@blocksuite/affine/effects';
import * as globalUtils from '@blocksuite/affine/global/utils';
import * as services from '@blocksuite/affine/shared/services';
import * as store from '@blocksuite/affine/store';
import * as editor from '@blocksuite/integration-test';
import { effects as presetsEffects } from '@blocksuite/integration-test/effects';

import { setupEdgelessTemplate } from '../_common/setup.js';
import { effects as commentEffects } from '../comment/effects.js';
import {
  createStarterDocCollection,
  initStarterDocCollection,
} from './utils/collection.js';
import { mountDefaultDocEditor } from './utils/setup-playground';
import { prepareTestApp } from './utils/test';

blocksEffects();
presetsEffects();
commentEffects();

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
        blocks: {
          database: databaseBlocks,
          note: noteBlocks,
        },
        global: { utils: globalUtils },
        services,
        editor,
        blockStd: blockStd,
      }),
    });
    await prepareTestApp(collection);

    return;
  }

  await initStarterDocCollection(collection);
  await mountDefaultDocEditor(collection);
}

main().catch(console.error);
