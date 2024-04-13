import type { BlockSpec } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { FrameBlockSchema } from '../frame-block/frame-model.js';
import { SurfaceBlockSchema } from '../surface-block/surface-model.js';
import { SurfacePageService } from '../surface-block/surface-page-service.js';
import { SurfaceService } from '../surface-block/surface-service.js';
import {
  SurfaceRefBlockSchema,
  SurfaceRefBlockService,
} from '../surface-ref-block/index.js';
import { EdgelessRootSpec } from './base/edgeless-root.js';
import { CommonFirstPartyBlockSpecs } from './base/general.js';
import { PageRootSpec } from './base/page-root.js';

export const PageEditorBlockSpecs: BlockSpec[] = [
  PageRootSpec,
  ...CommonFirstPartyBlockSpecs,
  {
    schema: SurfaceBlockSchema,
    view: {
      component: literal`affine-surface`,
    },
    service: SurfacePageService,
  },
  {
    schema: SurfaceRefBlockSchema,
    service: SurfaceRefBlockService,
    view: {
      component: literal`affine-surface-ref`,
      widgets: {
        surfaceToolbar: literal`affine-surface-ref-toolbar`,
      },
    },
  },
];

export const EdgelessEditorBlockSpecs: BlockSpec[] = [
  EdgelessRootSpec,
  ...CommonFirstPartyBlockSpecs,
  {
    schema: SurfaceBlockSchema,
    view: {
      component: literal`affine-surface`,
    },
    service: SurfaceService,
  },
  {
    schema: FrameBlockSchema,
    view: {
      component: literal`affine-frame`,
    },
  },
  {
    schema: SurfaceRefBlockSchema,
    service: SurfaceRefBlockService,
    view: {
      component: literal`affine-edgeless-surface-ref`,
    },
  },
];
