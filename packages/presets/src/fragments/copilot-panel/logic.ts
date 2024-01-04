import type { AffineEditorContainer } from '../../editors/index.js';
import { AIChatLogic } from './chat/logic.js';
import { AIDocLogic } from './doc/logic.js';
import { AIEdgelessLogic } from './edgeless/logic.js';

export class AILogic {
  constructor(public editor: AffineEditorContainer) {}

  edgeless = new AIEdgelessLogic(this.editor);
  doc = new AIDocLogic(this.editor);
  chat = new AIChatLogic(this.editor);
}
