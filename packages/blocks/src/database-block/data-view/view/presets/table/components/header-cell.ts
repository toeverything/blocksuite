import type { CellRenderProps } from '../../../../column/index.js';

import {
  HeaderAreaTextCell,
  HeaderAreaTextCellEditing,
} from '../../../../../columns/title/text.js';
import { createFromBaseCellRenderer } from '../../../../column/renderer.js';
import { map } from '../../../../utils/uni-component/operation.js';

export const headerRenderer = {
  view: map(
    createFromBaseCellRenderer(HeaderAreaTextCell),
    (props: CellRenderProps) => ({ ...props, showIcon: true })
  ),
  edit: map(
    createFromBaseCellRenderer(HeaderAreaTextCellEditing),
    (props: CellRenderProps) => ({ ...props, showIcon: true })
  ),
};
