import type { BlockSchemaType } from '@blocksuite/store';

import type { BlockServiceConstructor } from '../service/index.js';

export interface BlockView<WidgetNames extends string = string> {
  component: BlockSuite.Component;
  widgets?: Record<WidgetNames, BlockSuite.Component>;
}

export interface BlockSpec<WidgetNames extends string = string> {
  schema: BlockSchemaType;
  service?: BlockServiceConstructor;
  view: BlockView<WidgetNames>;
}
