import { createIcon } from '../../../../components/icon/uni-icon.js';
import { tString } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { TextCell, TextCellEditing } from './cell-renderer.js';
import { textColumnTypeName } from './type.js';

declare global {
  interface ColumnConfigMap {
    [textColumnTypeName]: typeof textColumnConfig;
  }
}
export const textColumnConfig = columnManager.register<string>(
  textColumnTypeName,
  {
    name: 'Plain-Text',
    icon: createIcon('TextIcon'),
    type: () => tString.create(),
    defaultData: () => ({}),
    cellToString: data => data ?? '',
    cellToJson: data => data ?? null,
  }
);
columnRenderer.register({
  type: textColumnTypeName,
  cellRenderer: {
    view: createFromBaseCellRenderer(TextCell),
    edit: createFromBaseCellRenderer(TextCellEditing),
  },
});
