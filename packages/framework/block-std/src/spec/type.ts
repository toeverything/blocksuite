import type { DisposableGroup } from '@blocksuite/global/utils';
import type { BlockSchemaType } from '@blocksuite/store';

import type { BlockService } from '../service/index.js';
import type { BlockServiceConstructor } from '../service/index.js';
import type { BlockSpecSlots } from './slots.js';

export interface BlockView<WidgetNames extends string = string> {
  component: BlockSuite.Component;
  widgets?: Record<WidgetNames, BlockSuite.Component>;
}

export interface BlockSpec<
  WidgetNames extends string = string,
  Service extends BlockService = BlockService,
> {
  schema: BlockSchemaType;
  service?: BlockServiceConstructor<Service>;
  view: BlockView<WidgetNames>;
  setup?: (slots: BlockSpecSlots, disposableGroup: DisposableGroup) => void;
}
