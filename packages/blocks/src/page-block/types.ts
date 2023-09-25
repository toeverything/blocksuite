import type { AFFINE_DOC_REMOTE_SELECTION_WIDGET_TAG } from '../widgets/doc-remote-selection/doc-remote-selection.js';
import type { AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET_TAG } from '../widgets/edgeless-remote-selection/index.js';
import type { AFFINE_FORMAT_BAR_WIDGET_TAG } from '../widgets/format-bar/format-bar.js';
import type { DocPageBlockComponent } from './doc/doc-page-block.js';
import type { EdgelessPageBlockComponent } from './edgeless/edgeless-page-block.js';

export type DocPageBlockWidgetName =
  | 'modal'
  | 'slashMenu'
  | 'linkedPage'
  | 'draggingArea'
  | 'dragHandle'
  | typeof AFFINE_FORMAT_BAR_WIDGET_TAG
  | typeof AFFINE_DOC_REMOTE_SELECTION_WIDGET_TAG;
export type EdgelessPageBlockWidgetName =
  | 'modal'
  | 'slashMenu'
  | 'linkedPage'
  | 'dragHandle'
  | typeof AFFINE_FORMAT_BAR_WIDGET_TAG
  | typeof AFFINE_DOC_REMOTE_SELECTION_WIDGET_TAG
  | typeof AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET_TAG;

export type PageBlockComponent =
  | DocPageBlockComponent
  | EdgelessPageBlockComponent;
