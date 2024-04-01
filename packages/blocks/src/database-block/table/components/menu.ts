import type { ReferenceElement } from '@floating-ui/dom';
import { html } from 'lit';

import {
  type Menu,
  popFilterableSimpleMenu,
} from '../../../_common/components/menu/index.js';
import {
  DeleteIcon,
  ExpandFullIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '../../../_common/icons/index.js';
import type { RootBlockComponent } from '../../../root-block/types.js';
import type { DataViewColumnManager } from '../../common/data-view-manager.js';
import type { DataViewNative } from '../../data-view.js';
import type { TableSelectionController } from '../controller/selection.js';
import {
  checkboxCalcOps,
  type ColumnDataType,
  commonCalcOps,
  numberColCalcOps,
  type StatCalcOp,
} from './stat-ops.js';

export const openDetail = (
  dataViewEle: DataViewNative,
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
  dataViewEle: DataViewNative,
  ele: ReferenceElement,
  rowId: string,
  selection: TableSelectionController
) => {
  popFilterableSimpleMenu(ele, [
    {
      type: 'action',
      name: 'Expand Row',
      icon: ExpandFullIcon,
      select: () => {
        openDetail(dataViewEle, rowId, selection);
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
            selection.insertRowBefore(selection.selection?.groupKey, rowId);
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
            selection.insertRowAfter(selection.selection?.groupKey, rowId);
          },
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
            selection.deleteRow(rowId);
          },
        },
      ],
    },
  ]);
};

export const popFormulaMenu = (
  _rootElement: RootBlockComponent | null,
  elem: ReferenceElement,
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

  const menus: Menu[] = operations.map(f => ({
    type: 'action',
    name: f.label,
    select: () => {
      onSelect(f);
    },
  }));

  return popFilterableSimpleMenu(elem, menus);
};
