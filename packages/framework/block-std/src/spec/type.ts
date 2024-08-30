import type { BlockModel } from '@blocksuite/store';
import type { StaticValue } from 'lit/static-html.js';

export type BlockCommands = Partial<BlockSuite.Commands>;
export type BlockViewType = StaticValue | ((model: BlockModel) => StaticValue);
export type WidgetViewMapType = Record<string, StaticValue>;
