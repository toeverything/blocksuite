import { ToolbarModuleExtension } from '@labre/affine-shared/services';
import { BlockFlavourIdentifier } from '@labre/std';

import { builtinInlineLinkToolbarConfig } from './link-node/configs/toolbar.js';

export const linkToolbar = ToolbarModuleExtension({
  id: BlockFlavourIdentifier('affine:link'),
  config: builtinInlineLinkToolbarConfig,
});
