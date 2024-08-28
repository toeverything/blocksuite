import type { ReferenceInfo } from '@blocksuite/affine-model';
import type { Slot } from '@blocksuite/global/utils';

// TODO: remove these slots
export type RefNodeSlots = {
  docLinkClicked: Slot<ReferenceInfo>;
  tagClicked: Slot<{ tagId: string }>;
};
