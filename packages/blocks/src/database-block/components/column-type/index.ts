import { ColumnRendererHelper } from '../../register.js';
import { CheckboxColumnRenderer } from './checkbox.js';
import { MultiSelectColumnRenderer } from './multi-select.js';
import { NumberColumnRenderer } from './number.js';
import { RichTextColumnRenderer } from './rich-text.js';
import { SelectColumnRenderer } from './select/select.js';

export function registerInternalRenderer() {
  const columnRenderer = new ColumnRendererHelper();

  columnRenderer.register(NumberColumnRenderer);
  columnRenderer.register(SelectColumnRenderer);
  columnRenderer.register(MultiSelectColumnRenderer);
  columnRenderer.register(RichTextColumnRenderer);
  columnRenderer.register(CheckboxColumnRenderer);

  return columnRenderer;
}
