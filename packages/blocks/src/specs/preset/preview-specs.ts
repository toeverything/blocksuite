import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

// import { AFFINE_BLOCK_HUB_WIDGET } from '../../root-block/widgets/block-hub/block-hub.js';
import { PageRootService } from '../../root-block/page/page-root-service.js';
import { RootBlockSchema } from '../../root-block/root-model.js';
import { PageSurfaceBlockSpec } from '../../surface-block/surface-spec.js';
import { PageSurfaceRefBlockSpec } from '../../surface-ref-block/surface-ref-spec.js';
import { CommonFirstPartyBlockSpecs } from '../common.js';

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
  PageSurfaceBlockSpec,
  PageSurfaceRefBlockSpec,
];
