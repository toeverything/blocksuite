import type { BlockFlavourIdentifier } from '@blocksuite/block-std';

import type { ToolbarModuleConfig } from './config';

export type ToolbarModule = {
  readonly id: ReturnType<typeof BlockFlavourIdentifier>;

  readonly config: ToolbarModuleConfig;
};
