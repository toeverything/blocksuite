import { RootBlockSchema } from '@blocksuite/affine-model';
import { type BlockSpec, FlavourExtension } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { PageRootService } from '../page/page-root-service.js';

export const PreviewPageSpec: BlockSpec = {
  schema: RootBlockSchema,
  view: {
    component: literal`affine-preview-root`,
  },
  extensions: [FlavourExtension('affine:page'), PageRootService],
};
