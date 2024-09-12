import { GfxViewportElement } from './gfx/viewport-element.js';
import { EditorHost } from './view/index.js';

export function effects() {
  customElements.define('editor-host', EditorHost);
  customElements.define('gfx-viewport', GfxViewportElement);
}
