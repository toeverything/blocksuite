import { Text } from '@blocksuite/store';

import { tTag } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { multiSelectColumnTypeName } from '../multi-select/type.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { richTextColumnTypeName } from '../rich-text/type.js';
import type { SelectColumnData } from '../types.js';
import { SelectCell, SelectCellEditing } from './cell-renderer.js';
import { selectColumnTypeName } from './type.js';

declare global {
  interface ColumnConfigMap {
    [selectColumnTypeName]: typeof selectHelper;
  }
}
const selectHelper = columnManager.register<string, SelectColumnData>(
  selectColumnTypeName,
  {
    type: data => tTag.create({ tags: data.options }),
    defaultData: () => ({
      options: [],
    }),
    cellToString: (data, colData) =>
      colData.options.find(v => v.id === data)?.value ?? '',
    cellToJson: data => data ?? null,
  }
);

columnRenderer.register({
  type: selectColumnTypeName,
  cellRenderer: {
    view: createFromBaseCellRenderer(SelectCell),
    edit: createFromBaseCellRenderer(SelectCellEditing),
  },
});
selectHelper.registerConvert(multiSelectColumnTypeName, (column, cells) => ({
  column,
  cells: cells.map(v => (v ? [v] : undefined)),
}));

selectHelper.registerConvert(richTextColumnTypeName, (column, cells) => {
  const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
  return {
    column: {},
    cells: cells.map(v => new Text(v ? optionMap[v]?.value : '').yText),
  };
});
