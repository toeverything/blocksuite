import { registerTagSchemaRenderer } from '@blocksuite/global/database';
import { NumberTagSchemaRenderer } from './number.js';
import { SelectTagSchemaRenderer } from './select.js';
import { TextTagSchemaRenderer } from './text.js';
import { RichTextTagSchemaRenderer } from './rich-text.js';

export function registerInternalRenderer() {
  registerTagSchemaRenderer(NumberTagSchemaRenderer);
  registerTagSchemaRenderer(SelectTagSchemaRenderer);
  registerTagSchemaRenderer(TextTagSchemaRenderer);
  registerTagSchemaRenderer(RichTextTagSchemaRenderer);
}
