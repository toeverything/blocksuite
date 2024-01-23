import { createIcon } from '../../../../_common/components/icon/uni-icon.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import {
  RichTextCell,
  RichTextCellEditing,
} from '../rich-text/cell-renderer.js';
import { titleColumnTypeName, titlePureColumnConfig } from './define.js';

columnRenderer.register({
  type: titleColumnTypeName,
  icon: createIcon('TitleIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(RichTextCell),
    edit: createFromBaseCellRenderer(RichTextCellEditing),
  },
});

export const titleColumnConfig = titlePureColumnConfig;
