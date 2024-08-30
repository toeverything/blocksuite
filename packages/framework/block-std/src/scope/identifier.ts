import { createIdentifier } from '@blocksuite/global/di';

import type { BlockService, BlockServiceWatcher } from '../extension/index.js';

export const BlockServiceIdentifier =
  createIdentifier<BlockService>('BlockService');

export const BlockFlavourIdentifier = createIdentifier<{ flavour: string }>(
  'BlockFlavour'
);

export const BlockServiceWatcherIdentifier =
  createIdentifier<BlockServiceWatcher>('BlockServiceWatcher');
