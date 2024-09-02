import type { BlockViewType } from '../spec/type.js';
import type { ExtensionType } from './extension.js';

import { BlockViewIdentifier } from '../identifier.js';

export function BlockViewExtension(
  flavour: BlockSuite.Flavour,
  view: BlockViewType
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(BlockViewIdentifier(flavour), () => view);
    },
  };
}
