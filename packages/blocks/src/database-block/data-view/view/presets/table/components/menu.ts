import { html } from 'lit';

import type { RootBlockComponent } from '../../../../../../root-block/index.js';
import type { DataViewRenderer } from '../../../../data-view.js';
import type { Column } from '../../../../view-manager/column.js';
import type { TableSelectionController } from '../controller/selection.js';

import {
  type Menu,
  popFilterableSimpleMenu,
} from '../../../../../../_common/components/index.js';
import {
  ExpandFullIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '../../../../../../_common/icons/index.js';
import { DeleteIcon } from '../../../../common/icons/index.js';
import {
  type ColumnDataType,
  type StatCalcOp,
  checkboxCalcOps,
  commonCalcOps,
  numberColCalcOps,
} from '../stat-ops.js';
import { type RowWithGroup, TableRowSelection } from '../types.js';

export const openDetail = (
  dataViewEle: DataViewRenderer,
  rowId: string,
  selection: TableSelectionController
) => {
  const old = selection.selection;
  selection.selection = undefined;
  dataViewEle.openDetailPanel({
    view: selection.host.view,
    rowId: rowId,
    onClose: () => {
      selection.selection = old;
    },
  });
};

export const popRowMenu = (
  dataViewEle: DataViewRenderer,
  ele: HTMLElement,
  row: RowWithGroup,
  selectionController: TableSelectionController
) => {
  const selection = selectionController.selection;
  if (TableRowSelection.is(selection) && selection.rows.length > 1) {
    return;
  }
  popFilterableSimpleMenu(ele, [
    {
      type: 'action',
      name: 'Expand Row',
      icon: ExpandFullIcon,
      select: () => {
        openDetail(dataViewEle, row.id, selectionController);
      },
    },
    // {
    //   type: 'group',
    //   name: '',
    //   children: () => [
    //     {
    //       type: 'action',
    //       name: 'Copy',
    //       icon: CopyIcon,
    //       select: () => {
    //         //TODO
    //       },
    //     },
    //     {
    //       type: 'action',
    //       name: 'Paste',
    //       icon: PasteIcon,
    //       select: () => {
    //         //TODO
    //       },
    //     },
    //   ],
    // },
    {
      type: 'group',
      name: '',
      children: () => [
        {
          type: 'action',
          name: 'Insert Before',
          icon: html` <div
            style="transform: rotate(90deg);display:flex;align-items:center;"
          >
            ${MoveLeftIcon}
          </div>`,
          select: () => {
            selectionController.insertRowBefore(row.groupKey, row.id);
          },
        },
        {
          type: 'action',
          name: 'Insert After',
          icon: html` <div
            style="transform: rotate(90deg);display:flex;align-items:center;"
          >
            ${MoveRightIcon}
          </div>`,
          select: () => {
            selectionController.insertRowAfter(row.groupKey, row.id);
          },
        },
        // {
        //   type: 'action',
        //   name: 'Duplicate',
        //   icon: DuplicateIcon,
        //   select: () => {
        //     selectionController.duplicateRow(rowId);
        //   },
        // },
      ],
    },
    {
      type: 'group',
      name: '',
      children: () => [
        {
          type: 'action',
          name: 'Delete Row',
          class: 'delete-item',
          icon: DeleteIcon,
          select: () => {
            selectionController.deleteRow(row.id);
          },
        },
      ],
    },
  ]);
};

export const popColStatOperationMenu = (
  _rootComponent: RootBlockComponent | null,
  elem: HTMLElement,
  _column: Column,
  calcType: ColumnDataType,
  onSelect: (formula: StatCalcOp) => void
) => {
  let operations: StatCalcOp[] = [];
  switch (calcType) {
    case 'number':
      operations = numberColCalcOps;
      break;
    case 'checkbox':
      operations = checkboxCalcOps;
      break;
    default:
      operations = commonCalcOps;
  }

  const menus: Menu[] = operations.map(op => ({
    type: 'action',
    name: op.label,
    select: () => {
      onSelect(op);
    },
  }));

  return popFilterableSimpleMenu(elem, menus);
};
