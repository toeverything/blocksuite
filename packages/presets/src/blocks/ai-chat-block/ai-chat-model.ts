import type { SerializedXYWH } from '@blocksuite/global/utils';

import { selectable } from '@blocksuite/block-std/edgeless';
import { BlockModel, defineBlockSchema } from '@blocksuite/store';

type AIChatProps = {
  xywh: SerializedXYWH;
  index: string;
  scale: number;
  messages: string; // JSON string of ChatMessage[]
  sessionId: string;
};

export const AIChatBlockSchema = defineBlockSchema({
  flavour: 'affine:embed-ai-chat',
  props: (): AIChatProps => ({
    xywh: '[0,0,0,0]',
    index: 'a0',
    scale: 1,
    messages: '',
    sessionId: '',
  }),
  metadata: {
    version: 1,
    role: 'content',
    children: [],
  },
  toModel: () => {
    return new AIChatBlockModel();
  },
});

export class AIChatBlockModel extends selectable<AIChatProps>(BlockModel) {}
