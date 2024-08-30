import { EmbedLinkedDocBlockSchema } from '@blocksuite/affine-model';
import { type BlockSpec, FlavourExtension } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import type { EmbedLinkedDocBlockConfig } from './embed-linked-doc-config.js';

import { commands } from './commands/index.js';
import './embed-edgeless-linked-doc-block.js';
import { EmbedLinkedDocBlockService } from './embed-linked-doc-service.js';

export type EmbedLinkedDocBlockSpecType = BlockSpec<
  string,
  EmbedLinkedDocBlockConfig
>;

export const EmbedLinkedDocBlockSpec: EmbedLinkedDocBlockSpecType = {
  schema: EmbedLinkedDocBlockSchema,
  view: {
    component: model => {
      return model.parent?.flavour === 'affine:surface'
        ? literal`affine-embed-edgeless-linked-doc-block`
        : literal`affine-embed-linked-doc-block`;
    },
  },
  commands,
  extensions: [
    FlavourExtension('affine:embed-linked-doc'),
    EmbedLinkedDocBlockService,
  ],
};
