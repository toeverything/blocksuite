import type { BlockSchemaType } from '@blocksuite/store';

import type { BlockServiceConstructor } from '../service/index.js';

export interface BlockView<ComponentType = unknown> {
  component: ComponentType;
  widgets?: ComponentType[];
}

export interface BlockSpec<ComponentType = unknown> {
  schema: BlockSchemaType;
  service?: BlockServiceConstructor;
  view: BlockView<ComponentType>;
}
