import { createIcon } from '../../../../components/icon/uni-icon.js';
import { tBoolean } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { CheckboxCell } from './cell-renderer.js';
import { checkboxColumnTypeName } from './type.js';

declare global {
  interface ColumnConfigMap {
    [checkboxColumnTypeName]: typeof checkboxColumnConfig;
  }
}

export const checkboxColumnConfig = columnManager.register<boolean>(
  checkboxColumnTypeName,
  {
    name: 'Checkbox',
    icon: createIcon('TodoIcon'),
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
