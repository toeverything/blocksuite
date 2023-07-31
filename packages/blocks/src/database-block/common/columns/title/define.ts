import type { Text } from '@blocksuite/store';

import { tString } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';

export const titleColumnTypeName = 'title';

declare global {
  interface ColumnConfigMap {
    [titleColumnTypeName]: typeof titlePureColumnConfig;
  }
}
export const titlePureColumnConfig = columnManager.register<Text['yText']>(
  titleColumnTypeName,
  {
    name: 'Title',
    type: () => tString.create(),
    defaultData: () => ({}),
    cellToString: data => data?.toString() ?? '',
    cellToJson: data => data?.toString() ?? null,
  }
);
