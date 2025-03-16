import type { MenuOptions } from '@blocksuite/affine-components/context-menu';
import { type DatabaseBlockModel } from '@blocksuite/affine-model';
import { ConfigExtensionFactory } from '@blocksuite/block-std';

export interface DatabaseOptionsConfig {
  configure: (model: DatabaseBlockModel, options: MenuOptions) => MenuOptions;
}

export const DatabaseConfigExtension =
  ConfigExtensionFactory<DatabaseOptionsConfig>('affine:database');
