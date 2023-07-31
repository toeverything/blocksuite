import { createIcon } from '../../../../components/icon/uni-icon.js';
import { tString } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';

declare global {
  interface ColumnConfigMap {
    link: typeof linkPureColumnConfig;
  }
}
export const linkPureColumnConfig = columnManager.register<string>('link', {
  name: 'Link',
  icon: createIcon('LinkIcon'),
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data ?? null,
});
