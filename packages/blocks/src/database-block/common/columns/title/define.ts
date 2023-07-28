import type { Text } from '@blocksuite/store';

import { tString } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { TitleCell } from './cell-renderer.js';
import { titleColumnTypeName } from './type.js';

declare global {
  interface ColumnConfigMap {
    [titleColumnTypeName]: typeof titleHelper;
  }
}
const titleHelper = columnManager.register<Text['yText']>(titleColumnTypeName, {
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data?.toString() ?? null,
});

columnRenderer.register({
  type: titleColumnTypeName,
  cellRenderer: {
    view: createFromBaseCellRenderer(TitleCell),
  },
});
