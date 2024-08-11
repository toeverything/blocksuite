import type { BlockSpec } from '@blocksuite/block-std';

import { RootBlockSchema } from '@blocksuite/affine-model';
import { literal, unsafeStatic } from 'lit/static-html.js';

import type { RootBlockConfig } from '../index.js';

import { AFFINE_DOC_REMOTE_SELECTION_WIDGET } from '../widgets/doc-remote-selection/doc-remote-selection.js';
import { AFFINE_DRAG_HANDLE_WIDGET } from '../widgets/drag-handle/drag-handle.js';
import { AFFINE_EMBED_CARD_TOOLBAR_WIDGET } from '../widgets/embed-card-toolbar/embed-card-toolbar.js';
import { AFFINE_FORMAT_BAR_WIDGET } from '../widgets/format-bar/format-bar.js';
import { AFFINE_INNER_MODAL_WIDGET } from '../widgets/inner-modal/inner-modal.js';
import { AFFINE_LINKED_DOC_WIDGET } from '../widgets/linked-doc/index.js';
import { AFFINE_MODAL_WIDGET } from '../widgets/modal/modal.js';
import { AFFINE_PAGE_DRAGGING_AREA_WIDGET } from '../widgets/page-dragging-area/page-dragging-area.js';
import { AFFINE_SLASH_MENU_WIDGET } from '../widgets/slash-menu/index.js';
import { AFFINE_VIEWPORT_OVERLAY_WIDGET } from '../widgets/viewport-overlay/viewport-overlay.js';
import { PageRootService } from './page-root-service.js';

export type PageRootBlockWidgetName =
  | typeof AFFINE_MODAL_WIDGET
  | typeof AFFINE_INNER_MODAL_WIDGET
  | typeof AFFINE_SLASH_MENU_WIDGET
  | typeof AFFINE_LINKED_DOC_WIDGET
  | typeof AFFINE_PAGE_DRAGGING_AREA_WIDGET
  | typeof AFFINE_DRAG_HANDLE_WIDGET
  | typeof AFFINE_EMBED_CARD_TOOLBAR_WIDGET
  | typeof AFFINE_FORMAT_BAR_WIDGET
  | typeof AFFINE_DOC_REMOTE_SELECTION_WIDGET
  | typeof AFFINE_VIEWPORT_OVERLAY_WIDGET;

export type PageRootBlockSpecType = BlockSpec<
  PageRootBlockWidgetName,
  RootBlockConfig
>;

export const PageRootBlockSpec: PageRootBlockSpecType = {
  schema: RootBlockSchema,
  service: PageRootService,
  view: {
    component: literal`affine-page-root`,
    widgets: {
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
      [AFFINE_EMBED_CARD_TOOLBAR_WIDGET]: literal`${unsafeStatic(
        AFFINE_EMBED_CARD_TOOLBAR_WIDGET
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
      [AFFINE_VIEWPORT_OVERLAY_WIDGET]: literal`${unsafeStatic(
        AFFINE_VIEWPORT_OVERLAY_WIDGET
      )}`,
    },
  },
};
