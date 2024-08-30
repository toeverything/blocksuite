import { type BlockSpec, FlavourExtension } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { DataViewBlockSchema } from './data-view-model.js';
import { DataViewBlockService } from './database-service.js';

export const DataViewBlockSpec: BlockSpec = {
  schema: DataViewBlockSchema,
  view: {
    component: literal`affine-data-view`,
  },
  extensions: [FlavourExtension('affine:data-view'), DataViewBlockService],
};
