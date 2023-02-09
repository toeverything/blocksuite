import { registerTagSchemaRenderer } from '../../register.js';
import { NumberTagSchemaRenderer } from './number.js';
import { RichTextTagSchemaRenderer } from './rich-text.js';
import { SelectTagSchemaRenderer } from './select.js';

export function registerInternalRenderer() {
  registerTagSchemaRenderer(NumberTagSchemaRenderer);
  registerTagSchemaRenderer(SelectTagSchemaRenderer);
  registerTagSchemaRenderer(RichTextTagSchemaRenderer);
}
