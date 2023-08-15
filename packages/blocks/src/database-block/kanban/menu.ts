import type { ReferenceElement } from '@floating-ui/dom';
import { html } from 'lit';

import { popFilterableSimpleMenu } from '../../components/menu/index.js';
import {
  ArrowRightBigIcon,
  DeleteIcon,
  ExpandFullIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '../../icons/index.js';
import { popSideDetail } from '../common/detail/layout.js';
import type { KanbanSelection } from './selection.js';

export const openDetail = (rowId: string, selection: KanbanSelection) => {
  const old = selection.selection;
  selection.selection = undefined;
  popSideDetail({
    view: selection.view,
    rowId: rowId,
    onClose: () => {
      selection.selection = old;
    },
  });
};

export const popCardMenu = (
  ele: ReferenceElement,
  rowId: string,
  selection: KanbanSelection
) => {
  popFilterableSimpleMenu(ele, [
    {
      type: 'sub-menu',
      name: 'Move to',
      icon: ArrowRightBigIcon,
      options: {
        input: {
          search: true,
        },
        items:
          selection.view.groupHelper?.groups
            .filter(v => v.key !== selection.selection?.groupKey)
            .map(group => {
              return {
                type: 'action',
                name: group.value != null ? group.name : 'Ungroup',
                select: () => {
                  selection.moveCard(rowId, group.key);
                },
              };
            }) ?? [],
      },
    },
    {
      type: 'group',
      name: '',
      children: () => [
        {
          type: 'action',
          name: 'Expend card',
          icon: ExpandFullIcon,
          select: () => {
            openDetail(rowId, selection);
          },
        },
        {
          type: 'action',
          name: 'Insert before',
          icon: html` <div style="transform: rotate(90deg)">
            ${MoveLeftIcon}
          </div>`,
          select: () => {
            selection.insertRowBefore();
          },
        },
        {
          type: 'action',
          name: 'Insert after',
          icon: html` <div style="transform: rotate(90deg)">
            ${MoveRightIcon}
          </div>`,
          select: () => {
            selection.insertRowAfter();
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
          name: 'Delete card',
          class: 'delete-item',
          icon: DeleteIcon,
          select: () => {
            selection.deleteCard();
          },
        },
      ],
    },
  ]);
};
