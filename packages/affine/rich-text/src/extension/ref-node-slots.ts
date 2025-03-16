import { createIdentifier } from '@blocksuite/global/di';
import type { ExtensionType } from '@blocksuite/store';
import { Subject } from 'rxjs';

import type { RefNodeSlots } from '../inline/index.js';

export const RefNodeSlotsProvider =
  createIdentifier<RefNodeSlots>('AffineRefNodeSlots');

const slots: RefNodeSlots = {
  docLinkClicked: new Subject(),
};

export const RefNodeSlotsExtension: ExtensionType = {
  setup: di => {
    di.addImpl(RefNodeSlotsProvider, () => slots);
  },
};
