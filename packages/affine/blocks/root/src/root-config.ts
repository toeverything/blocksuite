import { ConfigExtensionFactory } from '@blocksuite/std';

import type { KeyboardToolbarConfig } from './widgets/keyboard-toolbar/config.js';

export interface RootBlockConfig {
  keyboardToolbar?: Partial<KeyboardToolbarConfig>;
}

export const RootBlockConfigExtension =
  ConfigExtensionFactory<RootBlockConfig>('affine:root-block');
