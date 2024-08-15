import type { DisposableGroup } from '@blocksuite/global/utils';
import type { BlockModel, BlockSchemaType } from '@blocksuite/store';
import type { StaticValue } from 'lit/static-html.js';

import type { BlockService } from '../service/index.js';
import type { BlockServiceConstructor } from '../service/index.js';
import type { BlockSpecSlots } from './slots.js';

export interface BlockView<WidgetNames extends string = string> {
  component: StaticValue | ((model: BlockModel) => StaticValue);
  widgets?: Record<WidgetNames, StaticValue>;
}

export type BlockCommands = Partial<BlockSuite.Commands>;

export interface BlockSpec<
  WidgetNames extends string = string,
  BlockConfig = object,
  Service extends BlockService = BlockService,
> {
  schema: BlockSchemaType;
  view: BlockView<WidgetNames>;
  config?: BlockConfig;
  commands?: BlockCommands;
  service?: BlockServiceConstructor<Service>;
  setup?: (slots: BlockSpecSlots, disposableGroup: DisposableGroup) => void;
}
