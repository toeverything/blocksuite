import type { MenuOptions } from '@blocksuite/affine-components/context-menu';
import type { DatabaseBlockModel } from '@blocksuite/affine-model';

export interface DatabaseOptionsConfig {
  configure: (model: DatabaseBlockModel, options: MenuOptions) => MenuOptions;
}
