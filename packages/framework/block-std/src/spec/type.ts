import type { BlockModel, BlockSchemaType } from '@blocksuite/store';
import type { StaticValue } from 'lit/static-html.js';

import type { ExtensionType, InlineExtensionType } from '../extension/index.js';

export interface BlockView<WidgetNames extends string = string> {
  component: StaticValue | ((model: BlockModel) => StaticValue);
  widgets?: Record<WidgetNames, StaticValue>;
}

export type BlockCommands = Partial<BlockSuite.Commands>;

export interface BlockSpec<
  WidgetNames extends string = string,
  BlockConfig = object,
> {
  extensions?: (ExtensionType | InlineExtensionType)[];
  schema: BlockSchemaType;
  view: BlockView<WidgetNames>;
  config?: BlockConfig;
  commands?: BlockCommands;
}
