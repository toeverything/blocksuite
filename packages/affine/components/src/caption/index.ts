import { BlockCaptionEditor } from './block-caption.js';
export { BlockCaptionEditor, type BlockCaptionProps } from './block-caption.js';
export { CaptionedBlockComponent } from './captioned-block-component.js';

export function effects() {
  customElements.define('block-caption-editor', BlockCaptionEditor);
}
