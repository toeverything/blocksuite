import type { ExtensionType } from './extension.js';

import { BlockFlavourIdentifier } from '../identifier.js';

/**
 * Create a flavour extension.
 *
 * @param flavour
 * The flavour of the block that the extension is for.
 *
 * @example
 * ```ts
 * import { FlavourExtension } from '@blocksuite/block-std';
 *
 * const MyFlavourExtension = FlavourExtension('my-flavour');
 * ```
 */
export function FlavourExtension(flavour: string): ExtensionType {
  return {
    setup: di => {
      di.addImpl(BlockFlavourIdentifier(flavour), () => ({
        flavour,
      }));
    },
  };
}
