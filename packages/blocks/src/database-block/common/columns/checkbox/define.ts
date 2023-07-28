import { tBoolean } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { CheckboxCell } from './cell-renderer.js';
import { checkboxColumnTypeName } from './type.js';

declare global {
  interface ColumnConfigMap {
    [checkboxColumnTypeName]: typeof checkboxColumnHelper;
  }
}
const checkboxColumnHelper = columnManager.register<boolean>(
  checkboxColumnTypeName,
  {
    type: () => tBoolean.create(),
    defaultData: () => ({}),
    cellToString: data => '',
    cellToJson: data => data ?? null,
  }
);

columnRenderer.register({
  type: checkboxColumnTypeName,
  cellRenderer: {
    view: createFromBaseCellRenderer(CheckboxCell),
  },
});
