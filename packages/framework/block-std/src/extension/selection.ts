import type { SelectionConstructor } from '../selection/index.js';
import type { ExtensionType } from './extension.js';

import { SelectionIdentifier } from '../identifier.js';

export function SelectionExtension(
  selectionCtor: SelectionConstructor
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(SelectionIdentifier(selectionCtor.type), () => selectionCtor);
    },
  };
}
