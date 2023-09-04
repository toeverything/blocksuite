import type { AFFINE_DATABASE_CONVERT_WIDGET_TAG } from '../widgets/database-convert/database-convert.js';
import type { AFFINE_FORMAT_BAR_WIDGET_TAG } from '../widgets/format-bar/format-bar.js';
import type { AFFINE_REMOTE_SELECTION_WIDGET_TAG } from '../widgets/remote-selection/remote-selection.js';
import type { DocPageBlockComponent } from './doc/doc-page-block.js';
import type { EdgelessPageBlockComponent } from './edgeless/edgeless-page-block.js';

export type DocPageBlockWidgetName =
  | 'slashMenu'
  | 'linkedPage'
  | 'draggingArea'
  | 'dragHandle'
  | typeof AFFINE_FORMAT_BAR_WIDGET_TAG
  | typeof AFFINE_DATABASE_CONVERT_WIDGET_TAG
  | typeof AFFINE_REMOTE_SELECTION_WIDGET_TAG;
export type EdgelessPageBlockWidgetName =
  | 'remoteSelection'
  | 'slashMenu'
  | 'linkedPage'
  | 'dragHandle'
  | typeof AFFINE_FORMAT_BAR_WIDGET_TAG
  | typeof AFFINE_DATABASE_CONVERT_WIDGET_TAG
  | typeof AFFINE_REMOTE_SELECTION_WIDGET_TAG;

export type PageBlockComponent =
  | DocPageBlockComponent
  | EdgelessPageBlockComponent;
