import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

import { AIChatBlockSchema } from './ai-chat-model.js';

export const AIChatBlockSpec: BlockSpec = {
  schema: AIChatBlockSchema,
  view: {
    component: literal`affine-ai-chat`,
  },
};

export const EdgelessAIChatBlockSpec: BlockSpec = {
  schema: AIChatBlockSchema,
  view: {
    component: literal`affine-edgeless-ai-chat`,
  },
};
