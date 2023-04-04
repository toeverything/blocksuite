import { registerColumnRenderer } from '../../register.js';
import { MultiSelectColumnRenderer } from './multi-select.js';
import { NumberColumnRenderer } from './number.js';
import { RichTextColumnRenderer } from './rich-text.js';
import { SelectColumnRenderer } from './select.js';

export function registerInternalRenderer() {
  registerColumnRenderer(NumberColumnRenderer);
  registerColumnRenderer(SelectColumnRenderer);
  registerColumnRenderer(MultiSelectColumnRenderer);
  registerColumnRenderer(RichTextColumnRenderer);
}
