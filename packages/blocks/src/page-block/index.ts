import './default/meta-data/backlink/backlink-popover.js';

import type { LitBlockSpec } from '@blocksuite/lit';
import { literal } from 'lit/static-html.js';

import { DefaultPageService } from './default/default-page-service.js';
import { EdgelessPageService } from './edgeless/edgeless-page-service.js';
import { PageBlockSchema } from './page-model.js';
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
  | 'draggingArea';
export type EdgelessPageBlockWidgetName = 'slashMenu' | 'linkedPage';

export const pageBlockSpec: LitBlockSpec<DocPageBlockWidgetName> = {
  schema: PageBlockSchema,
  service: DefaultPageService,
  view: {
    component: literal`affine-default-page`,
    widgets: {
      slashMenu: literal`affine-slash-menu-widget`,
      linkedPage: literal`affine-linked-page-widget`,
      draggingArea: literal`affine-doc-dragging-area-widget`,
    },
  },
};

export const edgelessBlockSpec: LitBlockSpec<EdgelessPageBlockWidgetName> = {
  schema: PageBlockSchema,
  service: EdgelessPageService,
  view: {
    component: literal`affine-edgeless-page`,
    widgets: {
      slashMenu: literal`affine-slash-menu-widget`,
      linkedPage: literal`affine-linked-page-widget`,
    },
  },
};
