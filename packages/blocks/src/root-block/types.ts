// import type { AFFINE_BLOCK_HUB_WIDGET } from '../root-block/widgets/block-hub/block-hub.js';

import type { EdgelessRootBlockComponent } from './edgeless/edgeless-root-block.js';
import type { PageRootBlockComponent } from './page/page-root-block.js';
import type { AFFINE_PIE_MENU_ID_EDGELESS_TOOLS } from './widgets/pie-menu/config.js';

export type RootBlockComponent =
  | PageRootBlockComponent
  | EdgelessRootBlockComponent;

export type PieMenuId = typeof AFFINE_PIE_MENU_ID_EDGELESS_TOOLS;
