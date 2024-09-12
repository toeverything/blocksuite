import { VElement, VLine, VText } from './components/index.js';

export function effects() {
  customElements.define('v-element', VElement);
  customElements.define('v-line', VLine);
  customElements.define('v-text', VText);
}
