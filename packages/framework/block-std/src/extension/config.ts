import type { ExtensionType } from './extension.js';

import { ConfigIdentifier } from '../identifier.js';

/**
 * Create a config extension.
 * A config extension provides a configuration object for a block flavour.
 * The configuration object can be used like:
 * ```ts
 * const config = std.provider.get(ConfigIdentifier('my-flavour'));
 * ```
 *
 * @param flavor The flavour of the block that the config is for.
 * @param config The configuration object.
 *
 * @example
 * ```ts
 * import { ConfigExtension } from '@blocksuite/block-std';
 * const MyConfigExtension = ConfigExtension('my-flavour', config);
 * ```
 */
export function ConfigExtension(
  flavor: BlockSuite.Flavour,
  config: Record<string, unknown>
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(ConfigIdentifier(flavor), () => config);
    },
  };
}
