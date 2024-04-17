import type { BlockSpec } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

// import { AFFINE_BLOCK_HUB_WIDGET } from '../root-block/widgets/block-hub/block-hub.js';
import { PageRootService } from '../../root-block/page/page-root-service.js';
import { RootBlockSchema } from '../../root-block/root-model.js';
import { SurfaceBlockSchema } from '../../surface-block/surface-model.js';
import { SurfacePageService } from '../../surface-block/surface-page-service.js';
import { CommonFirstPartyBlockSpecs } from './general.js';

const PreviewPageSpec: BlockSpec = {
  schema: RootBlockSchema,
  service: PageRootService,
  view: {
    component: literal`affine-preview-root`,
  },
};

export const PreviewEditorBlockSpecs: BlockSpec[] = [
  PreviewPageSpec,
  ...CommonFirstPartyBlockSpecs,
  {
    schema: SurfaceBlockSchema,
    service: SurfacePageService,
    view: {
      component: literal`affine-surface`,
    },
  },
];
