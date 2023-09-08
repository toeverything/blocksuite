import type { BlockSchemaType } from '@blocksuite/store';

import type { BlockServiceConstructor } from '../service/index.js';

export interface BlockView<
  ComponentType = unknown,
  WidgetNames extends string = string,
> {
  component: ComponentType;
  widgets?: Record<WidgetNames, ComponentType>;
}

export interface BlockSpec<
  ComponentType = unknown,
  WidgetNames extends string = string,
> {
  schema: BlockSchemaType;
  service?: BlockServiceConstructor;
  view: BlockView<ComponentType, WidgetNames>;
}
