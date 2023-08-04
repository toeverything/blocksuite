import type { DocPageBlockComponent } from './doc/doc-page-block.js';
import type { EdgelessPageBlockComponent } from './edgeless/edgeless-page-block.js';

export type DocPageBlockWidgetName =
  | 'slashMenu'
  | 'linkedPage'
  | 'draggingArea'
  | 'dragHandle';
export type EdgelessPageBlockWidgetName =
  | 'slashMenu'
  | 'linkedPage'
  | 'dragHandle';

export type PageBlockComponent =
  | DocPageBlockComponent
  | EdgelessPageBlockComponent;
