import { EdgelessTextEditor } from './edgeless-text-editor';

export function effects() {
  customElements.define('edgeless-text-editor', EdgelessTextEditor);
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-text-editor': EdgelessTextEditor;
  }
}
