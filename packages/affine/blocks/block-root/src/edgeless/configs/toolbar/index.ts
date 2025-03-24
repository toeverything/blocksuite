import { edgelessTextToolbarConfig } from '@blocksuite/affine-block-edgeless-text';
import { frameToolbarExtension } from '@blocksuite/affine-block-frame';
import { connectorToolbarConfig } from '@blocksuite/affine-gfx-connector';
import { textToolbarConfig } from '@blocksuite/affine-gfx-text';
import { ToolbarModuleExtension } from '@blocksuite/affine-shared/services';
import { BlockFlavourIdentifier } from '@blocksuite/block-std';
import type { ExtensionType } from '@blocksuite/store';

import { builtinBrushToolbarConfig } from './brush';
import { builtinGroupToolbarConfig } from './group';
import { builtinMindmapToolbarConfig } from './mindmap';
import { builtinLockedToolbarConfig, builtinMiscToolbarConfig } from './misc';
import { builtinShapeToolbarConfig } from './shape';

export const EdgelessElementToolbarExtension: ExtensionType[] = [
  frameToolbarExtension,

  ToolbarModuleExtension({
    id: BlockFlavourIdentifier('affine:surface:group'),
    config: builtinGroupToolbarConfig,
  }),

  ToolbarModuleExtension({
    id: BlockFlavourIdentifier('affine:surface:brush'),
    config: builtinBrushToolbarConfig,
  }),

  ToolbarModuleExtension({
    id: BlockFlavourIdentifier('affine:surface:connector'),
    config: connectorToolbarConfig,
  }),

  ToolbarModuleExtension({
    id: BlockFlavourIdentifier('affine:surface:mindmap'),
    config: builtinMindmapToolbarConfig,
  }),

  ToolbarModuleExtension({
    id: BlockFlavourIdentifier('affine:surface:text'),
    config: textToolbarConfig,
  }),

  ToolbarModuleExtension({
    id: BlockFlavourIdentifier('affine:surface:edgeless-text'),
    config: edgelessTextToolbarConfig,
  }),

  ToolbarModuleExtension({
    id: BlockFlavourIdentifier('affine:surface:shape'),
    config: builtinShapeToolbarConfig,
  }),

  ToolbarModuleExtension({
    id: BlockFlavourIdentifier('affine:surface:*'),
    config: builtinMiscToolbarConfig,
  }),

  // Special Scenarios
  // Only display the `unlock` button when the selection includes a locked element.
  ToolbarModuleExtension({
    id: BlockFlavourIdentifier('affine:surface:locked'),
    config: builtinLockedToolbarConfig,
  }),
];
