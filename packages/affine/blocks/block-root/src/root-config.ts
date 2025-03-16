import { ConfigExtensionFactory } from '@blocksuite/block-std';

import type { KeyboardToolbarConfig } from './widgets/keyboard-toolbar/config.js';
import type { LinkedWidgetConfig } from './widgets/linked-doc/index.js';

export interface RootBlockConfig {
  linkedWidget?: Partial<LinkedWidgetConfig>;
  keyboardToolbar?: Partial<KeyboardToolbarConfig>;
}

export const RootBlockConfigExtension =
  ConfigExtensionFactory<RootBlockConfig>('affine:root-block');
