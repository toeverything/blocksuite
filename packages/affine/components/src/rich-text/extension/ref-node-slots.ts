import type { ExtensionType } from '@blocksuite/block-std';

import { createIdentifier } from '@blocksuite/global/di';
import { Slot } from '@blocksuite/global/utils';

import type { RefNodeSlots } from '../inline/index.js';

export const RefNodeSlotsProvider =
  createIdentifier<RefNodeSlots>('AffineRefNodeSlots');

export function RefNodeSlotsExtension(
  slots: RefNodeSlots = {
    docLinkClicked: new Slot(),
  }
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(RefNodeSlotsProvider, () => slots);
    },
  };
}
