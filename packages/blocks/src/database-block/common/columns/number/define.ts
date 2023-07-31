import { Text } from '@blocksuite/store';

import { createIcon } from '../../../../components/icon/uni-icon.js';
import { tNumber } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { richTextColumnTypeName } from '../rich-text/type.js';
import { NumberCell, NumberCellEditing } from './cell-renderer.js';
import { numberColumnTypeName } from './type.js';

declare global {
  interface ColumnConfigMap {
    [numberColumnTypeName]: typeof numberColumnConfig;
  }
}
export const numberColumnConfig = columnManager.register<
  number,
  {
    decimal: number;
  }
>(numberColumnTypeName, {
  name: 'Number',
  icon: createIcon('DatabaseNumber'),
  type: () => tNumber.create(),
  defaultData: () => ({ decimal: 0 }),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data ?? null,
});
columnRenderer.register({
  type: numberColumnTypeName,
  cellRenderer: {
    view: createFromBaseCellRenderer(NumberCell),
    edit: createFromBaseCellRenderer(NumberCellEditing),
  },
});
numberColumnConfig.registerConvert(richTextColumnTypeName, (column, cells) => ({
  column: {},
  cells: cells.map(v => new Text(v?.toString()).yText),
}));
