import type { BlockSpec } from '@blocksuite/block-std';

import { RootBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import { PageRootService } from '../../root-block/page/page-root-service.js';
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
