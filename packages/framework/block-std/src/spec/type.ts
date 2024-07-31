import type { DisposableGroup } from '@blocksuite/global/utils';
import type { BlockSchemaType } from '@blocksuite/store';
import type { StaticValue } from 'lit/static-html.js';

import type { BlockService } from '../service/index.js';
import type { BlockServiceConstructor } from '../service/index.js';
import type { BlockSpecSlots } from './slots.js';

export interface BlockView<WidgetNames extends string = string> {
  component: StaticValue;
  widgets?: Record<WidgetNames, StaticValue>;
}

export interface BlockSpec<
  WidgetNames extends string = string,
  Service extends BlockService = BlockService,
  BlockConfig = object,
> {
  schema: BlockSchemaType;
  view: BlockView<WidgetNames>;
  config?: BlockConfig;
  service?: BlockServiceConstructor<Service>;
  setup?: (slots: BlockSpecSlots, disposableGroup: DisposableGroup) => void;
}
