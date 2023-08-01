import './default/meta-data/backlink/backlink-popover.js';

import type { AFFINE_FORMAT_BAR_WIDGET_TAG } from '../widgets/format-bar/format-bar.js';
export * from './default/default-page-block.js';
export { getAllowSelectedBlocks } from './default/utils.js';
export {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from './edgeless/components/component-toolbar/change-shape-button.js';
export { readImageSize } from './edgeless/components/utils.js';
export * from './edgeless/edgeless-page-block.js';
export { type PageBlockModel, PageBlockSchema } from './page-model.js';
export * from './page-service.js';
export * from './utils/index.js';

export type DocPageBlockWidgetName =
  | 'slashMenu'
  | 'linkedPage'
  | 'draggingArea'
  | typeof AFFINE_FORMAT_BAR_WIDGET_TAG;
export type EdgelessPageBlockWidgetName = 'slashMenu' | 'linkedPage';
