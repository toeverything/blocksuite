import { ToolbarModuleExtension } from '@labre/affine-shared/services';
import { BlockFlavourIdentifier } from '@labre/std';

import { builtinInlineReferenceToolbarConfig } from './reference-node/configs/toolbar';

export const referenceNodeToolbar = ToolbarModuleExtension({
  id: BlockFlavourIdentifier('affine:reference'),
  config: builtinInlineReferenceToolbarConfig,
});
