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
    cellToString: data => (data ? 'True' : 'False'),
    cellFromString: data => {
      return {
        value: !!data,
      };
    },
    cellToJson: data => data ?? null,
  }
);
