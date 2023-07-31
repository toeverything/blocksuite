import { tDate } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';

declare global {
  interface ColumnConfigMap {
    date: typeof datePureColumnConfig;
  }
}
export const datePureColumnConfig = columnManager.register<number>('date', {
  name: 'Date',
  type: () => tDate.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data ?? null,
});
