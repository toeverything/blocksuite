import { createIdentifier } from '@blocksuite/global/di';

import type { ExtensionType } from '../extension';
import type { SelectionConstructor } from './types';

export const SelectionIdentifier =
  createIdentifier<SelectionConstructor>('Selection');

export function SelectionExtension(
  selectionCtor: SelectionConstructor
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(SelectionIdentifier(selectionCtor.type), () => selectionCtor);
    },
  };
}
