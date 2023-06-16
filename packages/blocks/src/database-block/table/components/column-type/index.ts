import { ColumnRendererHelper } from '../../register.js';
import { CheckboxColumnRenderer } from './checkbox.js';
import { MultiSelectColumnRenderer } from './multi-select.js';
import { NumberColumnRenderer } from './number.js';
import { ProgressColumnRenderer } from './progress.js';
import { RichTextColumnRenderer } from './rich-text.js';
import { SelectColumnRenderer } from './select.js';
import { TitleColumnRenderer } from './title.js';

export function registerInternalRenderer() {
  const columnRenderer = new ColumnRendererHelper();

  columnRenderer.register(TitleColumnRenderer);
  columnRenderer.register(NumberColumnRenderer);
  columnRenderer.register(SelectColumnRenderer);
  columnRenderer.register(MultiSelectColumnRenderer);
  columnRenderer.register(RichTextColumnRenderer);
  columnRenderer.register(ProgressColumnRenderer);
  columnRenderer.register(CheckboxColumnRenderer);

  return columnRenderer;
}
