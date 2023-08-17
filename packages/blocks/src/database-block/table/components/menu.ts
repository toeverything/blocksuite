import type { ReferenceElement } from '@floating-ui/dom';
import { html } from 'lit';

import { popFilterableSimpleMenu } from '../../../components/menu/index.js';
import {
  DeleteIcon,
  ExpandFullIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '../../../icons/index.js';
import { popSideDetail } from '../../common/detail/layout.js';
import type { DatabaseSelectionView } from './selection.js';

export const openDetail = (rowId: string, selection: DatabaseSelectionView) => {
  const old = selection.selection;
  selection.selection = undefined;
  popSideDetail({
    view: selection.tableView.view,
    rowId: rowId,
    onClose: () => {
      selection.selection = old;
    },
  });
};

export const popRowMenu = (
  ele: ReferenceElement,
  rowId: string,
  selection: DatabaseSelectionView
) => {
  popFilterableSimpleMenu(ele, [
    {
      type: 'action',
      name: 'Expand row',
      icon: ExpandFullIcon,
      select: () => {
        openDetail(rowId, selection);
      },
    },
    {
      type: 'action',
      name: 'Insert before',
      icon: html` <div style="transform: rotate(90deg)">${MoveLeftIcon}</div>`,
      select: () => {
        selection.insertRowBefore(rowId);
      },
    },
    {
      type: 'action',
      name: 'Insert after',
      icon: html` <div style="transform: rotate(90deg)">${MoveRightIcon}</div>`,
      select: () => {
        selection.insertRowAfter(rowId);
      },
    },
    {
      type: 'group',
      name: '',
      children: () => [
        {
          type: 'action',
          name: 'Delete row',
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
