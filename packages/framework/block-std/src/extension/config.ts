import type { ExtensionType } from './extension.js';

import { ConfigIdentifier } from '../identifier.js';

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
