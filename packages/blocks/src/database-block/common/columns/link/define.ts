import { tString } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';

declare global {
  interface ColumnConfigMap {
    link: typeof linkPureColumnConfig;
  }
}
export const linkPureColumnConfig = columnManager.register<string>('link', {
  name: 'Link',
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellFromString: data => {
    return {
      value: data,
    };
  },
  cellToJson: data => data ?? null,
});
