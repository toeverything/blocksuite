import type { AffineEditorContainer } from '../../editors/index.js';
import { AIDocLogic } from './doc/logic.js';
import { AIEdgelessLogic } from './edgeless/logic.js';

export class AILogic {
  constructor(public editor: AffineEditorContainer) {}

  edgeless = new AIEdgelessLogic(this.editor);
  doc = new AIDocLogic(this.editor);
}
