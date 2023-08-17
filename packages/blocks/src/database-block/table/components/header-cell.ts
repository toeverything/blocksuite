import { map } from '../../../components/uni-component/operation.js';
import type { CellRenderProps } from '../../common/columns/manager.js';
import { createFromBaseCellRenderer } from '../../common/columns/renderer.js';
import {
  HeaderAreaTextCell,
  HeaderAreaTextCellEditing,
} from '../../common/header-area/text.js';

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
