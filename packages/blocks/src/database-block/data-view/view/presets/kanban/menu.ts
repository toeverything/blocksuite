import { html } from 'lit';

import type { DataViewRenderer } from '../../../data-view.js';
import type { KanbanSelectionController } from './controller/selection.js';

import { popFilterableSimpleMenu } from '../../../../../_common/components/index.js';
import {
  ArrowRightBigIcon,
  ExpandFullIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '../../../../../_common/icons/index.js';
import { DeleteIcon } from '../../../common/icons/index.js';

export const openDetail = (
  dataViewEle: DataViewRenderer,
  rowId: string,
  selection: KanbanSelectionController
) => {
  const old = selection.selection;
  selection.selection = undefined;
  dataViewEle.openDetailPanel({
    onClose: () => {
      selection.selection = old;
    },
    rowId: rowId,
    view: selection.view,
  });
};

export const popCardMenu = (
  dataViewEle: DataViewRenderer,
  ele: HTMLElement,
  rowId: string,
  selection: KanbanSelectionController
) => {
  popFilterableSimpleMenu(ele, [
    {
      icon: ExpandFullIcon,
      name: 'Expand Card',
      select: () => {
        openDetail(dataViewEle, rowId, selection);
      },
      type: 'action',
    },
    {
      icon: ArrowRightBigIcon,
      name: 'Move To',
      options: {
        input: {
          search: true,
        },
        items:
          selection.view.groupHelper?.groups
            .filter(v => {
              const cardSelection = selection.selection;
              if (cardSelection?.selectionType === 'card') {
                return v.key !== cardSelection?.cards[0].groupKey;
              }
              return false;
            })
            .map(group => {
              return {
                name: group.value != null ? group.name : 'Ungroup',
                select: () => {
                  selection.moveCard(rowId, group.key);
                },
                type: 'action',
              };
            }) ?? [],
      },
      type: 'sub-menu',
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
            selection.insertRowBefore();
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
            selection.insertRowAfter();
          },
          type: 'action',
        },
      ],
      name: '',
      type: 'group',
    },
    {
      children: () => [
        {
          class: 'delete-item',
          icon: DeleteIcon,
          name: 'Delete Card',
          select: () => {
            selection.deleteCard();
          },
          type: 'action',
        },
      ],
      name: '',
      type: 'group',
    },
  ]);
};
