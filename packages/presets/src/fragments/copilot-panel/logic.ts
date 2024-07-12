import type { EditorHost } from '@blocksuite/block-std';

import { AIChatLogic } from './chat/logic.js';
import { AIDocLogic } from './doc/logic.js';
import { AIEdgelessLogic } from './edgeless/logic.js';

export class AILogic {
  chat = new AIChatLogic(this, this.getHost);

  doc = new AIDocLogic(this.getHost);

  edgeless = new AIEdgelessLogic(this.getHost);

  constructor(public getHost: () => EditorHost) {}
}
