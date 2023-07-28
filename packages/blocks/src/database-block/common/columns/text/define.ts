import { tString } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { TextCell, TextCellEditing } from './cell-renderer.js';
import { textColumnTypeName } from './type.js';

declare global {
  interface ColumnConfigMap {
    [textColumnTypeName]: typeof textHelper;
  }
}
const textHelper = columnManager.register<string>(textColumnTypeName, {
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data ?? '',
  cellToJson: data => data ?? null,
});
columnRenderer.register({
  type: textColumnTypeName,
  cellRenderer: {
    view: createFromBaseCellRenderer(TextCell),
    edit: createFromBaseCellRenderer(TextCellEditing),
  },
});
