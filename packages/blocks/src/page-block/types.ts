import type { AFFINE_BLOCK_HUB_WIDGET } from '../_common/widgets/block-hub/index.js';
import type { AFFINE_DOC_DRAGGING_AREA_WIDGET } from '../_common/widgets/doc-dragging-area/index.js';
import type { AFFINE_DOC_REMOTE_SELECTION_WIDGET } from '../_common/widgets/doc-remote-selection/doc-remote-selection.js';
import type { AFFINE_DRAG_HANDLE_WIDGET } from '../_common/widgets/drag-handle/index.js';
import type { AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET } from '../_common/widgets/edgeless-remote-selection/index.js';
import type { AFFINE_FORMAT_BAR_WIDGET } from '../_common/widgets/format-bar/format-bar.js';
import type { AFFINE_LINKED_PAGE_WIDGET } from '../_common/widgets/linked-page/index.js';
import type { AFFINE_MODAL_WIDGET } from '../_common/widgets/modal-widget/index.js';
import type { AFFINE_SLASH_MENU_WIDGET } from '../_common/widgets/slash-menu/index.js';
import type { DocPageBlockComponent } from './doc/doc-page-block.js';
import type { EdgelessPageBlockComponent } from './edgeless/edgeless-page-block.js';

export type DocPageBlockWidgetName =
  | typeof AFFINE_BLOCK_HUB_WIDGET
  | typeof AFFINE_MODAL_WIDGET
  | typeof AFFINE_SLASH_MENU_WIDGET
  | typeof AFFINE_LINKED_PAGE_WIDGET
  | typeof AFFINE_DOC_DRAGGING_AREA_WIDGET
  | typeof AFFINE_DRAG_HANDLE_WIDGET
  | typeof AFFINE_FORMAT_BAR_WIDGET
  | typeof AFFINE_DOC_REMOTE_SELECTION_WIDGET;
export type EdgelessPageBlockWidgetName =
  | typeof AFFINE_BLOCK_HUB_WIDGET
  | typeof AFFINE_MODAL_WIDGET
  | typeof AFFINE_SLASH_MENU_WIDGET
  | typeof AFFINE_LINKED_PAGE_WIDGET
  | typeof AFFINE_DRAG_HANDLE_WIDGET
  | typeof AFFINE_FORMAT_BAR_WIDGET
  | typeof AFFINE_DOC_REMOTE_SELECTION_WIDGET
  | typeof AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET;

export type PageBlockComponent =
  | DocPageBlockComponent
  | EdgelessPageBlockComponent;
