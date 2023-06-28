import './default/backlink-popover.js';

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
export * from './edgeless/edgeless-page-block.js';
export { type PageBlockModel, PageBlockSchema } from './page-model.js';
export * from './page-service.js';
export * from './utils/index.js';

export const pageBlockSpec: LitBlockSpec = {
  schema: PageBlockSchema,
  service: DefaultPageService,
  view: {
    component: literal`affine-default-page`,
  },
};

export const edgelessBlockSpec: LitBlockSpec = {
  schema: PageBlockSchema,
  service: EdgelessPageService,
  view: {
    component: literal`affine-edgeless-page`,
  },
};
