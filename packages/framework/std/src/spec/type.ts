import type { BlockModel } from '@labre/store';
import type { StaticValue } from 'lit/static-html.js';

export type BlockViewType = StaticValue | ((model: BlockModel) => StaticValue);
export type WidgetViewType = StaticValue;
