import type { DatabaseBlockModel } from '@blocksuite/affine-model';

import type { MenuOptions } from '../_common/components/index.js';

export interface DatabaseOptionsConfig {
  configure: (model: DatabaseBlockModel, options: MenuOptions) => MenuOptions;
}
