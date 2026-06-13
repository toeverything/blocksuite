import '../../style.css';

import * as databaseBlocks from '@labre/affine/blocks/database';
import * as noteBlocks from '@labre/affine/blocks/note';
import * as globalUtils from '@labre/affine/global/utils';
import * as services from '@labre/affine/shared/services';
import * as blockStd from '@labre/affine/std';
import * as store from '@labre/affine/store';
import * as affineModel from '@labre/affine-model';
import * as editor from '@labre/integration-test';
import { effects as itEffects } from '@labre/integration-test/effects';
import { getTestStoreManager } from '@labre/integration-test/store';

import { effects as commentEffects } from '../comment/effects.js';
import {
  createStarterDocCollection,
  initStarterDocCollection,
} from './utils/collection.js';
import { mountDefaultDocEditor } from './utils/setup-playground';
import { prepareTestApp } from './utils/test';

itEffects();
const storeManager = getTestStoreManager();
commentEffects();

async function main() {
  if (window.collection) return;

  const params = new URLSearchParams(location.search);
  const room = params.get('room') ?? Math.random().toString(16).slice(2, 8);
  const isE2E = room.startsWith('playwright');
  const collection = createStarterDocCollection(storeManager);

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
        affineModel: affineModel,
      }),
    });
    await prepareTestApp(collection);

    return;
  }

  await initStarterDocCollection(collection);
  await mountDefaultDocEditor(collection);
}

main().catch(console.error);
