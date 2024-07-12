import { html } from 'lit';

import type { RootBlockComponent } from '../../../../../../root-block/index.js';
import type { DataViewRenderer } from '../../../../data-view.js';
import type { DataViewColumnManager } from '../../../data-view-manager.js';
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

export const openDetail = (
  dataViewEle: DataViewRenderer,
  rowId: string,
  selection: TableSelectionController
) => {
  const old = selection.selection;
  selection.selection = undefined;
  dataViewEle.openDetailPanel({
    onClose: () => {
      selection.selection = old;
    },
    rowId: rowId,
    view: selection.host.view,
  });
};

export const popRowMenu = (
  dataViewEle: DataViewRenderer,
  ele: HTMLElement,
  rowId: string,
  selection: TableSelectionController
) => {
  popFilterableSimpleMenu(ele, [
    {
      icon: ExpandFullIcon,
      name: 'Expand Row',
      select: () => {
        openDetail(dataViewEle, rowId, selection);
      },
      type: 'action',
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
      children: () => [
        {
          icon: html` <div
            style="transform: rotate(90deg);display:flex;align-items:center;"
          >
            ${MoveLeftIcon}
          </div>`,
          name: 'Insert Before',
          select: () => {
            selection.insertRowBefore(selection.selection?.groupKey, rowId);
          },
          type: 'action',
        },
        {
          icon: html` <div
            style="transform: rotate(90deg);display:flex;align-items:center;"
          >
            ${MoveRightIcon}
          </div>`,
          name: 'Insert After',
          select: () => {
            selection.insertRowAfter(selection.selection?.groupKey, rowId);
          },
          type: 'action',
        },
        // {
        //   type: 'action',
        //   name: 'Duplicate',
        //   icon: DuplicateIcon,
        //   select: () => {
        //     selection.duplicateRow(rowId);
        //   },
        // },
      ],
      name: '',
      type: 'group',
    },
    {
      children: () => [
        {
          class: 'delete-item',
          icon: DeleteIcon,
          name: 'Delete Row',
          select: () => {
            selection.deleteRow(rowId);
          },
          type: 'action',
        },
      ],
      name: '',
      type: 'group',
    },
  ]);
};

export const popColStatOperationMenu = (
  _rootElement: RootBlockComponent | null,
  elem: HTMLElement,
  _column: DataViewColumnManager,
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
    name: op.label,
    select: () => {
      onSelect(op);
    },
    type: 'action',
  }));

  return popFilterableSimpleMenu(elem, menus);
};
