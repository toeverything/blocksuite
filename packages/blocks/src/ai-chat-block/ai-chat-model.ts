import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import type { SerializedXYWH } from '../surface-block/utils/xywh.js';

type ChatMessage = {
  content: string;
  role: 'user' | 'assistant';
  attachments?: string[];
  createdAt: string;
};

type ChatAction = {
  action: string;
  messages: ChatMessage[];
  sessionId: string;
  createdAt: string;
};

export type ChatItem = ChatMessage | ChatAction;

type AIChatProps = {
  xywh: SerializedXYWH;
  index: string;
  scale: number;
  items: ChatItem[];
};

export const AIChatBlockSchema = defineBlockSchema({
  flavour: 'affine:ai-chat',
  props: (): AIChatProps => ({
    xywh: '[0,0,0,0]',
    index: 'a0',
    scale: 1,
    items: [],
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:surface'],
    children: [],
  },
  toModel: () => {
    return new AIChatBlockModel();
  },
});

export class AIChatBlockModel extends selectable<AIChatProps>(BlockModel) {}
