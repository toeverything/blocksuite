import type { EditorHost } from '@blocksuite/lit';

import { AIChatLogic } from './chat/logic.js';
import { AIDocLogic } from './doc/logic.js';
import { AIEdgelessLogic } from './edgeless/logic.js';
import type { Copilot } from './model/index.js';

export class AILogic {
  constructor(
    public getHost: () => EditorHost,
    private copilot: Copilot
  ) {}

  edgeless = new AIEdgelessLogic(this.getHost);
  doc = new AIDocLogic(this.getHost);
  chat = new AIChatLogic(this, this.getHost, this.copilot);
}
