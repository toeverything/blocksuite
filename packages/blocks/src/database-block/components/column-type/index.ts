import { NumberTagSchemaRenderer } from './number.js';
import { SelectTagSchemaRenderer } from './select.js';
import { RichTextTagSchemaRenderer } from './rich-text.js';
import { registerTagSchemaRenderer } from '../../register.js';

export function registerInternalRenderer() {
  registerTagSchemaRenderer(NumberTagSchemaRenderer);
  registerTagSchemaRenderer(SelectTagSchemaRenderer);
  registerTagSchemaRenderer(RichTextTagSchemaRenderer);
}
