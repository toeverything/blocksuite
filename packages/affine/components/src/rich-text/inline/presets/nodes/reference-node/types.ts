import type { Slot } from '@blocksuite/global/utils';

// TODO: remove these slots
export type RefNodeSlots = {
  docLinkClicked: Slot<{ docId: string; blockId?: string }>;
  tagClicked: Slot<{ tagId: string }>;
};
