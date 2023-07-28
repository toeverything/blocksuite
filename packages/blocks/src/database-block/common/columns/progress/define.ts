import { Text } from '@blocksuite/store';

import { createIcon } from '../../../../components/icon/uni-icon.js';
import { tNumber } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { richTextColumnTypeName } from '../rich-text/type.js';
import { ProgressCell, ProgressCellEditing } from './cell-renderer.js';
import { progressColumnTypeName } from './type.js';

declare global {
  interface ColumnConfigMap {
    [progressColumnTypeName]: typeof progressHelper;
  }
}
const progressHelper = columnManager.register<number>(progressColumnTypeName, {
  name: 'Progress',
  icon: createIcon('DatabaseProgress'),
  type: () => tNumber.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data ?? null,
});
columnRenderer.register({
  type: progressColumnTypeName,
  cellRenderer: {
    view: createFromBaseCellRenderer(ProgressCell),
    edit: createFromBaseCellRenderer(ProgressCellEditing),
  },
});
progressHelper.registerConvert(richTextColumnTypeName, (column, cells) => ({
  column: {},
  cells: cells.map(v => new Text(v?.toString()).yText),
}));
