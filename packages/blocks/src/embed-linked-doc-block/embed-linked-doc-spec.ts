import type { BlockSpec } from '@blocksuite/block-std';

import { EmbedLinkedDocBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import type { EmbedLinkedDocBlockConfig } from './embed-linked-doc-config.js';

import { commands } from './commands/index.js';
import './embed-edgeless-linked-doc-block.js';

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
};
