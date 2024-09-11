import { popFilterableSimpleMenu } from '@blocksuite/affine-components/context-menu';
import {
  CopyIcon,
  DeleteIcon,
  ExpandFullIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '@blocksuite/icons/lit';
import { html } from 'lit';

import type { DataViewRenderer } from '../../../core/data-view.js';
import type { TableSelectionController } from '../controller/selection.js';

import { TableRowSelection } from '../types.js';

export const openDetail = (
  dataViewEle: DataViewRenderer,
  rowId: string,
  selection: TableSelectionController
) => {
  const old = selection.selection;
  selection.selection = undefined;
  dataViewEle.openDetailPanel({
    view: selection.host.props.view,
    rowId: rowId,
    onClose: () => {
      selection.selection = old;
    },
  });
};

export const popRowMenu = (
  dataViewEle: DataViewRenderer,
  ele: HTMLElement,
  selectionController: TableSelectionController
) => {
  const selection = selectionController.selection;
  if (!TableRowSelection.is(selection)) {
    return;
  }
  if (selection.rows.length > 1) {
    const rows = TableRowSelection.rowsIds(selection);
    popFilterableSimpleMenu(ele, [
      {
        type: 'group',
        name: '',
        children: () => [
          {
            type: 'action',
            name: 'Copy',
            icon: html` <div
              style="transform: rotate(90deg);display:flex;align-items:center;"
            >
              ${CopyIcon()}
            </div>`,
            select: () => {
              selectionController.host.clipboardController.copy();
            },
          },
        ],
      },
      {
        type: 'group',
        name: '',
        children: () => [
          {
            type: 'action',
            name: 'Delete Rows',
            class: 'delete-item',
            icon: DeleteIcon(),
            select: () => {
              selectionController.view.rowDelete(rows);
            },
          },
        ],
      },
    ]);
    return;
  }
  const row = selection.rows[0];
  popFilterableSimpleMenu(ele, [
    {
      type: 'action',
      name: 'Expand Row',
      icon: ExpandFullIcon(),
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
            ${MoveLeftIcon()}
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
            ${MoveRightIcon()}
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
          icon: DeleteIcon(),
          select: () => {
            selectionController.deleteRow(row.id);
          },
        },
      ],
    },
  ]);
};
