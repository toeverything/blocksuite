import { tBoolean } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';

declare global {
  interface ColumnConfigMap {
    checkbox: typeof checkboxPureColumnConfig;
  }
}

export const checkboxPureColumnConfig = columnManager.register<boolean>(
  'checkbox',
  {
    name: 'Checkbox',
    type: () => tBoolean.create(),
    defaultData: () => ({}),
    cellToString: data => '',
    cellToJson: data => data ?? null,
  }
);
