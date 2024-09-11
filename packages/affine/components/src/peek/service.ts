import type { ExtensionType } from '@blocksuite/block-std';

import { createIdentifier } from '@blocksuite/global/di';

import type { PeekViewService } from './type.js';

export const PeekViewProvider = createIdentifier<PeekViewService>(
  'AffinePeekViewProvider'
);

export function PeekViewExtension(service: PeekViewService): ExtensionType {
  return {
    setup: di => {
      di.addImpl(PeekViewProvider, () => service);
    },
  };
}
