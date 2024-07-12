import type { CellRenderProps } from '../../data-view/column/index.js';

import { createFromBaseCellRenderer } from '../../data-view/column/renderer.js';
import { map } from '../../data-view/utils/uni-component/operation.js';
import { createIcon } from '../../data-view/utils/uni-icon.js';
import { DataViewTableManager } from '../../data-view/view/presets/table/table-view-manager.js';
import { titlePureColumnConfig } from './define.js';
import { HeaderAreaTextCell, HeaderAreaTextCellEditing } from './text.js';

export const titleColumnConfig = titlePureColumnConfig.renderConfig({
  cellRenderer: {
    edit: map(
      createFromBaseCellRenderer(HeaderAreaTextCellEditing),
      (props: CellRenderProps) => ({
        ...props,
        showIcon: props.view instanceof DataViewTableManager,
      })
    ),
    view: map(
      createFromBaseCellRenderer(HeaderAreaTextCell),
      (props: CellRenderProps) => ({
        ...props,
        showIcon: props.view instanceof DataViewTableManager,
      })
    ),
  },
  icon: createIcon('TitleIcon'),
});
