import type { BlockSpec } from '@blocksuite/block-std';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { PageRootService } from '../../root-block/index.js';
import { RootBlockSchema } from '../../root-block/root-model.js';
import { AFFINE_DOC_REMOTE_SELECTION_WIDGET } from '../../root-block/widgets/doc-remote-selection/doc-remote-selection.js';
import { AFFINE_DRAG_HANDLE_WIDGET } from '../../root-block/widgets/drag-handle/drag-handle.js';
import { AFFINE_FORMAT_BAR_WIDGET } from '../../root-block/widgets/format-bar/format-bar.js';
import { AFFINE_INNER_MODAL_WIDGET } from '../../root-block/widgets/inner-modal/inner-modal.js';
import { AFFINE_LINKED_DOC_WIDGET } from '../../root-block/widgets/linked-doc/index.js';
import { AFFINE_MODAL_WIDGET } from '../../root-block/widgets/modal/modal.js';
import { AFFINE_PAGE_DRAGGING_AREA_WIDGET } from '../../root-block/widgets/page-dragging-area/page-dragging-area.js';
import { AFFINE_SLASH_MENU_WIDGET } from '../../root-block/widgets/slash-menu/index.js';

export type PageRootBlockWidgetName =
  // | typeof AFFINE_BLOCK_HUB_WIDGET
  | typeof AFFINE_MODAL_WIDGET
  | typeof AFFINE_INNER_MODAL_WIDGET
  | typeof AFFINE_SLASH_MENU_WIDGET
  | typeof AFFINE_LINKED_DOC_WIDGET
  | typeof AFFINE_PAGE_DRAGGING_AREA_WIDGET
  | typeof AFFINE_DRAG_HANDLE_WIDGET
  | typeof AFFINE_FORMAT_BAR_WIDGET
  | typeof AFFINE_DOC_REMOTE_SELECTION_WIDGET;

export const PageRootSpec: BlockSpec<PageRootBlockWidgetName> = {
  schema: RootBlockSchema,
  service: PageRootService,
  view: {
    component: literal`affine-page-root`,
    widgets: {
      // [AFFINE_BLOCK_HUB_WIDGET]: literal`${unsafeStatic(
      //   AFFINE_BLOCK_HUB_WIDGET
      // )}`,
      [AFFINE_MODAL_WIDGET]: literal`${unsafeStatic(AFFINE_MODAL_WIDGET)}`,
      [AFFINE_INNER_MODAL_WIDGET]: literal`${unsafeStatic(AFFINE_INNER_MODAL_WIDGET)}`,
      [AFFINE_SLASH_MENU_WIDGET]: literal`${unsafeStatic(
        AFFINE_SLASH_MENU_WIDGET
      )}`,
      [AFFINE_LINKED_DOC_WIDGET]: literal`${unsafeStatic(
        AFFINE_LINKED_DOC_WIDGET
      )}`,
      [AFFINE_DRAG_HANDLE_WIDGET]: literal`${unsafeStatic(
        AFFINE_DRAG_HANDLE_WIDGET
      )}`,
      [AFFINE_FORMAT_BAR_WIDGET]: literal`${unsafeStatic(
        AFFINE_FORMAT_BAR_WIDGET
      )}`,
      [AFFINE_DOC_REMOTE_SELECTION_WIDGET]: literal`${unsafeStatic(
        AFFINE_DOC_REMOTE_SELECTION_WIDGET
      )}`,
      [AFFINE_PAGE_DRAGGING_AREA_WIDGET]: literal`${unsafeStatic(
        AFFINE_PAGE_DRAGGING_AREA_WIDGET
      )}`,
    },
  },
};
