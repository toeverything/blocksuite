import { registerColumnSchemaRenderer } from '../../register.js';
import { NumberColumnSchemaRenderer } from './number.js';
import { RichTextColumnSchemaRenderer } from './rich-text.js';
import { SelectColumnSchemaRenderer } from './select.js';

export function registerInternalRenderer() {
  registerColumnSchemaRenderer(NumberColumnSchemaRenderer);
  registerColumnSchemaRenderer(SelectColumnSchemaRenderer);
  registerColumnSchemaRenderer(RichTextColumnSchemaRenderer);
}
