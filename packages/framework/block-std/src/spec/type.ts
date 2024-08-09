import type { DisposableGroup } from '@blocksuite/global/utils';
import type { BlockSchemaType } from '@blocksuite/store';
import type { StaticValue } from 'lit/static-html.js';

import type { Command } from '../command/types.js';
import type { BlockService } from '../service/index.js';
import type { BlockServiceConstructor } from '../service/index.js';
import type { BlockSpecSlots } from './slots.js';

export interface BlockView<WidgetNames extends string = string> {
  component: StaticValue;
  widgets?: Record<WidgetNames, StaticValue>;
}

export type BlockCommands = Partial<Record<keyof BlockSuite.Commands, Command>>;

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
