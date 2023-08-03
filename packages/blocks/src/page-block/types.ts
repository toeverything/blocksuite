import type { DocPageBlockComponent } from './doc/doc-page-block.js';
import type { EdgelessPageBlockComponent } from './edgeless/edgeless-page-block.js';

export type DocPageBlockWidgetName =
  | 'slashMenu'
  | 'linkedPage'
  | 'draggingArea';
export type EdgelessPageBlockWidgetName = 'slashMenu' | 'linkedPage';

export type PageBlockComponent =
  | DocPageBlockComponent
  | EdgelessPageBlockComponent;
