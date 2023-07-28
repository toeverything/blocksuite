import { tDate } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { DateCell, DateCellEditing } from './cell-renderer.js';
import { dateColumnTypeName } from './type.js';

declare global {
  interface ColumnConfigMap {
    [dateColumnTypeName]: typeof dateHelper;
  }
}
const dateHelper = columnManager.register<number>(dateColumnTypeName, {
  type: () => tDate.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data ?? null,
});
columnRenderer.register({
  type: dateColumnTypeName,
  cellRenderer: {
    view: createFromBaseCellRenderer(DateCell),
    edit: createFromBaseCellRenderer(DateCellEditing),
  },
});
