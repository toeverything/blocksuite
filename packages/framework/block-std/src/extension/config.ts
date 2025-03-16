import type { ServiceIdentifier } from '@blocksuite/global/di';
import type { ExtensionType } from '@blocksuite/store';

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
 * import { ConfigExtensionFactory } from '@blocksuite/block-std';
 * const MyConfigExtensionFactory = ConfigExtensionFactory<ConfigType>('my-flavour');
 * const MyConfigExtension = MyConfigExtensionFactory({
 *   option1: 'value1',
 *   option2: 'value2',
 * });
 * ```
 */
export function ConfigExtensionFactory<Config extends Record<string, any>>(
  flavor: string
): ((config: Config) => ExtensionType) & {
  identifier: ServiceIdentifier<Config>;
} {
  const identifier = ConfigIdentifier(flavor) as ServiceIdentifier<Config>;
  const extensionFactory = (config: Config): ExtensionType => ({
    setup: di => {
      di.addImpl(ConfigIdentifier(flavor), () => config);
    },
  });
  extensionFactory.identifier = identifier;
  return extensionFactory;
}
