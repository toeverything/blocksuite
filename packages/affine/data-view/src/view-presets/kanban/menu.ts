import { popFilterableSimpleMenu } from '@blocksuite/affine-components/context-menu';
import {
  ArrowRightBigIcon,
  DeleteIcon,
  ExpandFullIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '@blocksuite/icons/lit';
import { html } from 'lit';

import type { DataViewRenderer } from '../../core/data-view.js';
import type { KanbanSelectionController } from './controller/selection.js';

export const openDetail = (
  dataViewEle: DataViewRenderer,
  rowId: string,
  selection: KanbanSelectionController
) => {
  const old = selection.selection;
  selection.selection = undefined;
  dataViewEle.openDetailPanel({
    view: selection.view,
    rowId: rowId,
    onClose: () => {
      selection.selection = old;
    },
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
      type: 'action',
      name: 'Expand Card',
      icon: ExpandFullIcon(),
      select: () => {
        openDetail(dataViewEle, rowId, selection);
      },
    },
    {
      type: 'sub-menu',
      name: 'Move To',
      icon: ArrowRightBigIcon(),
      options: {
        input: {
          search: true,
        },
        items:
          selection.view.groupManager.groupsDataList$.value
            ?.filter(v => {
              const cardSelection = selection.selection;
              if (cardSelection?.selectionType === 'card') {
                return v.key !== cardSelection?.cards[0].groupKey;
              }
              return false;
            })
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
            selection.insertRowBefore();
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
          name: 'Delete Card',
          class: 'delete-item',
          icon: DeleteIcon(),
          select: () => {
            selection.deleteCard();
          },
        },
      ],
    },
  ]);
};
