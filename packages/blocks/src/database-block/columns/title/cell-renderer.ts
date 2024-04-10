import { createFromBaseCellRenderer } from '../../data-view/column/renderer.js';
import { createIcon } from '../../data-view/utils/uni-icon.js';
import {
  RichTextCell,
  RichTextCellEditing,
} from '../rich-text/cell-renderer.js';
import { titlePureColumnConfig } from './define.js';

export const titleColumnConfig = titlePureColumnConfig.renderConfig({
  icon: createIcon('TitleIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(RichTextCell),
    edit: createFromBaseCellRenderer(RichTextCellEditing),
  },
});
