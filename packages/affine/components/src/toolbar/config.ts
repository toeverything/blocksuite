import { ConfigExtensionFactory } from '@blocksuite/block-std';

import type { ToolbarMoreMenuConfig } from './types';

export const ToolbarMoreMenuConfigExtension = ConfigExtensionFactory<
  Partial<ToolbarMoreMenuConfig>
>('affine-toolbar-more-menu');
