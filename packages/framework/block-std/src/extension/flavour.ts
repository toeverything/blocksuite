import type { ExtensionType } from './extension.js';

import { BlockFlavourIdentifier } from '../identifier.js';

export function FlavourExtension(flavour: string): ExtensionType {
  return {
    setup: di => {
      di.addImpl(BlockFlavourIdentifier(flavour), () => ({
        flavour,
      }));
    },
  };
}
