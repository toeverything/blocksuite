import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

import type { EmbedLinkedDocBlockConfig } from './embed-linked-doc-block.js';

import { EmbedLinkedDocBlockSchema } from './embed-linked-doc-schema.js';
import { EmbedLinkedDocBlockService } from './embed-linked-doc-service.js';

export type EmbedLinkedDocBlockSpecType = BlockSpec<
  string,
  EmbedLinkedDocBlockService,
  EmbedLinkedDocBlockConfig
>;

export const EmbedLinkedDocBlockSpec: EmbedLinkedDocBlockSpecType = {
  schema: EmbedLinkedDocBlockSchema,
  view: {
    component: literal`affine-embed-linked-doc-block`,
  },
  service: EmbedLinkedDocBlockService,
};
