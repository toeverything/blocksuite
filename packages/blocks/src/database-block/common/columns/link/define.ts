import { createIcon } from '../../../../components/icon/uni-icon.js';
import { tString } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { LinkCell, LinkCellEditing } from './cell-renderer.js';
import { linkColumnTypeName } from './type.js';

declare global {
  interface ColumnConfigMap {
    [linkColumnTypeName]: typeof linkColumnConfig;
  }
}
export const linkColumnConfig = columnManager.register<string>(
  linkColumnTypeName,
  {
    name: 'Link',
    icon: createIcon('LinkIcon'),
    type: () => tString.create(),
    defaultData: () => ({}),
    cellToString: data => data?.toString() ?? '',
    cellToJson: data => data ?? null,
  }
);
columnRenderer.register({
  type: linkColumnTypeName,
  cellRenderer: {
    view: createFromBaseCellRenderer(LinkCell),
    edit: createFromBaseCellRenderer(LinkCellEditing),
  },
});
