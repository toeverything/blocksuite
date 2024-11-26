import {
  menu,
  popFilterableSimpleMenu,
  type PopupTarget,
} from '@blocksuite/affine-components/context-menu';
import {
  ArrowRightBigIcon,
  DeleteIcon,
  ExpandFullIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '@blocksuite/icons/lit';
import { html } from 'lit';

import type { DataViewRenderer } from '../../../core/data-view.js';
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
  ele: PopupTarget,
  rowId: string,
  selection: KanbanSelectionController
) => {
  popFilterableSimpleMenu(ele, [
    menu.action({
      name: 'Expand Card',
      prefix: ExpandFullIcon(),
      select: () => {
        openDetail(dataViewEle, rowId, selection);
      },
    }),
    menu.subMenu({
      name: 'Move To',
      prefix: ArrowRightBigIcon(),
      options: {
        items:
          selection.view.groupTrait.groupsDataList$.value
            ?.filter(v => {
              const cardSelection = selection.selection;
              if (cardSelection?.selectionType === 'card') {
                return v.key !== cardSelection?.cards[0].groupKey;
              }
              return false;
            })
            .map(group => {
              return menu.action({
                name: group.value != null ? group.name : 'Ungroup',
                select: () => {
                  selection.moveCard(rowId, group.key);
                },
              });
            }) ?? [],
      },
    }),
    menu.group({
      name: '',
      items: [
        menu.action({
          name: 'Insert Before',
          prefix: html` <div
            style="transform: rotate(90deg);display:flex;align-items:center;"
          >
            ${MoveLeftIcon()}
          </div>`,
          select: () => {
            selection.insertRowBefore();
          },
        }),
        menu.action({
          name: 'Insert After',
          prefix: html` <div
            style="transform: rotate(90deg);display:flex;align-items:center;"
          >
            ${MoveRightIcon()}
          </div>`,
          select: () => {
            selection.insertRowAfter();
          },
        }),
      ],
    }),
    menu.group({
      name: '',
      items: [
        menu.action({
          name: 'Delete Card',
          class: {
            'delete-item': true,
          },
          prefix: DeleteIcon(),
          select: () => {
            selection.deleteCard();
          },
        }),
      ],
    }),
  ]);
};
