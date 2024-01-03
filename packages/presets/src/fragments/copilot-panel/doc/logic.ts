import type { AffineEditorContainer } from '../../../editors/index.js';

export class AIDocLogic {
  constructor(private editor: AffineEditorContainer) {}
  get host() {
    return this.editor.host;
  }
}
