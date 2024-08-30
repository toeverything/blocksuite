import { RootBlockSchema } from '@blocksuite/affine-model';
import { DocModeService } from '@blocksuite/affine-shared/services';
import { type BlockSpec, FlavourExtension } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { PageRootService } from '../../root-block/page/page-root-service.js';
import { PageSurfaceBlockSpec } from '../../surface-block/surface-spec.js';
import { PageSurfaceRefBlockSpec } from '../../surface-ref-block/surface-ref-spec.js';
import { CommonFirstPartyBlockSpecs } from '../common.js';

const PreviewPageSpec: BlockSpec = {
  schema: RootBlockSchema,
  view: {
    component: literal`affine-preview-root`,
  },
  extensions: [
    FlavourExtension('affine:page'),
    PageRootService,
    DocModeService,
  ],
};

export const PreviewEditorBlockSpecs: BlockSpec[] = [
  PreviewPageSpec,
  ...CommonFirstPartyBlockSpecs,
  PageSurfaceBlockSpec,
  PageSurfaceRefBlockSpec,
];
