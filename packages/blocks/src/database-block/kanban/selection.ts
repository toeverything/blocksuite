import { assertExists, type Disposable } from '@blocksuite/global/utils';

import type {
  KanbanFocusData,
  KanbanViewSelection,
} from '../../__internal__/index.js';
import type { KanbanCard } from './card.js';
import { KanbanCell } from './cell.js';
import type { KanbanGroup } from './group.js';
import type { DataViewKanban } from './kanban-view.js';

export class KanbanSelection {
  _selection?: KanbanViewSelection;

  get view() {
    return this.viewEle.view;
  }

  constructor(private viewEle: DataViewKanban) {}

  run(): Disposable {
    return this.viewEle.selectionUpdated.on(selection => {
      const old = this._selection;
      if (old) {
        this.blur(old);
      }
      this._selection = selection;
      if (selection) {
        this.focus(selection);
      }
    });
  }

  get selection(): KanbanViewSelection | undefined {
    return this._selection;
  }

  set selection(
    data: Omit<KanbanViewSelection, 'viewId' | 'type'> | undefined
  ) {
    if (!data) {
      this.viewEle.setSelection();
      return;
    }
    const selection: KanbanViewSelection = {
      ...data,
      viewId: this.viewEle.view.id,
      type: 'kanban',
    };
    if (selection.focus && selection.focus.isEditing) {
      const focus = selection.focus;
      const container = this.getFocusCellContainer(selection);
      const cell = container?.cell;
      const isEditing = cell
        ? cell.beforeEnterEditMode()
          ? selection.focus.isEditing
          : false
        : false;
      this.viewEle.setSelection({
        ...selection,
        focus: {
          ...focus,
          isEditing,
        },
      });
    } else {
      this.viewEle.setSelection(selection);
    }
  }

  blur(selection: KanbanViewSelection) {
    if (!selection.focus) {
      const selectCard = this.getSelectCard(selection);
      if (selectCard) {
        selectCard.isFocus = false;
      }
      return;
    }
    const container = this.getFocusCellContainer(selection);
    if (!container) {
      return;
    }
    container.isFocus = false;
    const cell = container?.cell;

    if (selection.focus.isEditing) {
      cell?.onExitEditMode();
      if (cell?.blurCell()) {
        container.blur();
      }
      container.editing = false;
    } else {
      container.blur();
    }
  }

  focus(selection: KanbanViewSelection) {
    if (!selection.focus) {
      const selectCard = this.getSelectCard(selection);
      if (selectCard) {
        selectCard.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        selectCard.isFocus = true;
      }
      return;
    }
    const container = this.getFocusCellContainer(selection);
    if (!container) {
      return;
    }
    container.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    container.isFocus = true;
    const cell = container?.cell;
    if (selection.focus.isEditing) {
      cell?.onEnterEditMode();
      if (cell?.focusCell()) {
        container.focus();
      }
      container.editing = true;
    } else {
      container.focus();
    }
  }

  getGroupCardsBySelection() {
    const group = this.viewEle.querySelector(
      `affine-data-view-kanban-group[data-key="${this.selection?.groupKey}"]`
    ) as KanbanGroup | null;
    return Array.from(
      group?.querySelectorAll('affine-data-view-kanban-card') ?? []
    );
  }

  getCardCellsBySelection(selection: KanbanViewSelection) {
    const card = this.getSelectCard(selection);
    return Array.from(
      card?.querySelectorAll('affine-data-view-kanban-cell') ?? []
    );
  }

  getSelectCard(selection: KanbanViewSelection) {
    const group = this.viewEle.querySelector(
      `affine-data-view-kanban-group[data-key="${selection.groupKey}"]`
    );
    if (!group) return null;
    return group.querySelector<KanbanCard>(
      `affine-data-view-kanban-card[data-card-id="${selection.cardId}"]`
    );
  }

  getFocusCellContainerByCard(card: KanbanCard, focus: KanbanFocusData) {
    return card.querySelector<KanbanCell>(
      `affine-data-view-kanban-cell[data-column-id="${focus.columnId}"]`
    );
  }

  getFocusCellContainer(selection: KanbanViewSelection) {
    if (!selection.focus) {
      return null;
    }
    const card = this.getSelectCard(selection);
    if (!card) {
      return null;
    }
    return this.getFocusCellContainerByCard(card, selection.focus);
  }

  getFocusCellIndex(selection: KanbanViewSelection) {
    const kanbanCells = this.getCardCellsBySelection(selection);
    return kanbanCells.findIndex(
      cell => cell.column.id === selection.focus?.columnId
    );
  }

  getNextGroupFocusCell(
    groups: KanbanGroup[],
    selection: KanbanViewSelection,
    getNextGroupIndex: (groupIndex: number) => number
  ): {
    cell: KanbanCell;
    cardId: string;
    groupKey: string;
  } {
    const groupIndex = groups.findIndex(
      group => group.getAttribute('data-key') === selection.groupKey
    );

    const nextGroupIndex = getNextGroupIndex(groupIndex);

    const nextGroup = groups[nextGroupIndex];
    const cell = this.getFocusCellContainer(selection);
    assertExists(cell);
    const rect = cell.getBoundingClientRect();
    const nextCards = Array.from(
      nextGroup.querySelectorAll('affine-data-view-kanban-card')
    );
    const cardPos = nextCards
      .map((card, index) => {
        const targetRect = card.getBoundingClientRect();
        return {
          offsetY: getYOffset(rect, targetRect),
          index,
        };
      })
      .reduce((prev, curr) => {
        if (prev.offsetY < curr.offsetY) {
          return prev;
        }
        return curr;
      });

    const nextCard = nextCards[cardPos.index];
    const cells = Array.from(
      nextCard.querySelectorAll('affine-data-view-kanban-cell')
    );
    const cellPos = cells
      .map((card, index) => {
        const targetRect = card.getBoundingClientRect();
        return {
          offsetY: getYOffset(rect, targetRect),
          index,
        };
      })
      .reduce((prev, curr) => {
        if (prev.offsetY < curr.offsetY) {
          return prev;
        }
        return curr;
      });
    const nextCell = cells[cellPos.index];

    return {
      cell: nextCell,
      cardId: nextCard.getAttribute('data-card-id') as string,
      groupKey: nextGroup.getAttribute('data-key') as string,
    };
  }

  getNextCardFocusCell(
    nextPosition: 'up' | 'down',
    cards: KanbanCard[],
    selection: KanbanViewSelection,
    getNextCardIndex: (cardIndex: number) => number
  ): {
    cell: KanbanCell;
    cardId: string;
  } {
    const cardIndex = cards.findIndex(
      card => card.getAttribute('data-card-id') === selection.cardId
    );
    const nextCardIndex = getNextCardIndex(cardIndex);
    const nextCard = cards[nextCardIndex];
    const nextCells = Array.from(
      nextCard.querySelectorAll('affine-data-view-kanban-cell')
    );
    const nextCellIndex = nextPosition === 'up' ? nextCells.length - 1 : 0;
    return {
      cell: nextCells[nextCellIndex],
      cardId: nextCard.getAttribute('data-card-id') as string,
    };
  }

  getNextFocusCell(
    selection: KanbanViewSelection,
    index: number,
    nextPosition: 'up' | 'down' | 'left' | 'right'
  ): {
    cell: KanbanCell;
    cardId?: string;
    groupKey?: string;
  } {
    const kanbanCells = this.getCardCellsBySelection(selection);

    if (nextPosition === 'up') {
      const nextIndex = index - 1;
      if (nextIndex < 0) {
        const cards = this.getGroupCardsBySelection();
        const { cell, cardId } = this.getNextCardFocusCell(
          nextPosition,
          cards,
          selection,
          cardIndex => (cardIndex === 0 ? cards.length - 1 : cardIndex - 1)
        );

        return {
          cell,
          cardId,
        };
      }
      return {
        cell: kanbanCells[nextIndex],
      };
    }

    if (nextPosition === 'down') {
      const nextIndex = index + 1;
      if (nextIndex >= kanbanCells.length) {
        const cards = this.getGroupCardsBySelection();
        const { cell, cardId } = this.getNextCardFocusCell(
          nextPosition,
          cards,
          selection,
          cardIndex => (cardIndex === cards.length - 1 ? 0 : cardIndex + 1)
        );

        return {
          cell,
          cardId,
        };
      }
      return {
        cell: kanbanCells[nextIndex],
      };
    }

    const groups = Array.from(
      this.viewEle.querySelectorAll('affine-data-view-kanban-group')
    );

    if (nextPosition === 'right') {
      const { cell, cardId, groupKey } = this.getNextGroupFocusCell(
        groups,
        selection,
        groupIndex => (groupIndex === groups.length - 1 ? 0 : groupIndex + 1)
      );

      return {
        cell,
        cardId,
        groupKey,
      };
    }

    if (nextPosition === 'left') {
      const { cell, cardId, groupKey } = this.getNextGroupFocusCell(
        groups,
        selection,
        groupIndex => (groupIndex === 0 ? groups.length - 1 : groupIndex - 1)
      );

      return {
        cell,
        cardId,
        groupKey,
      };
    }

    throw new Error(
      'Unknown arrow keys, only support: up, down, left, and right keys.'
    );
  }

  public focusNext(position: 'up' | 'down' | 'left' | 'right') {
    const selection = this.selection;
    if (!selection || selection.focus?.isEditing) {
      return;
    }
    if (selection.focus) {
      const index = this.getFocusCellIndex(selection);
      const { cell, cardId, groupKey } = this.getNextFocusCell(
        selection,
        index,
        position
      );
      if (cell instanceof KanbanCell) {
        this.selection = {
          ...selection,
          cardId: cardId ?? selection.cardId,
          groupKey: groupKey ?? selection.groupKey,
          focus: {
            ...selection.focus,
            columnId: cell.column.id,
          },
        };
      }
    }
  }

  public focusOut() {
    const selection = this.selection;
    if (!selection) {
      return;
    }
    if (selection.focus) {
      if (selection.focus.isEditing) {
        this.selection = {
          ...selection,
          focus: {
            ...selection.focus,
            isEditing: false,
          },
        };
      } else {
        this.selection = {
          ...selection,
          focus: undefined,
        };
      }
    }
  }

  public focusIn() {
    const selection = this.selection;
    if (!selection || selection.focus?.isEditing) {
      return;
    }
    if (selection.focus) {
      this.selection = {
        ...selection,
        focus: {
          ...selection.focus,
          isEditing: true,
        },
      };
    } else {
      const card = this.getSelectCard(selection);
      const cell = card?.querySelector('affine-data-view-kanban-cell');
      if (cell) {
        this.selection = {
          ...selection,
          focus: {
            columnId: cell.column.id,
            isEditing: false,
          },
        };
      }
    }
  }

  public focusUp() {
    this.focusNext('up');
  }

  public focusDown() {
    this.focusNext('down');
  }

  public focusLeft() {
    this.focusNext('left');
  }

  public focusRight() {
    this.focusNext('right');
  }

  public deleteCard() {
    const selection = this.selection;
    if (!selection || !!selection.focus) {
      return;
    }
    this.viewEle.view.rowDelete([selection.cardId]);
    this.selection = undefined;
  }

  focusFirstCell() {
    const group = this.viewEle.groupHelper?.groups[0];
    const card = group?.rows[0];
    const columnId = card && this.viewEle.view.getHeaderTitle(card)?.id;
    if (group && card && columnId) {
      this.selection = {
        groupKey: group.key,
        cardId: card,
        focus: {
          columnId,
          isEditing: true,
        },
      };
    }
  }

  public insertRowBefore() {
    const selection = this.selection;
    if (!selection) {
      return;
    }
    const id = this.view.addCard(
      { before: true, id: selection.cardId },
      selection.groupKey
    );
    requestAnimationFrame(() => {
      const columnId = this.view.header.titleColumn;
      this.selection = {
        groupKey: selection.groupKey,
        cardId: id,
        focus: columnId
          ? {
              columnId: columnId,
              isEditing: true,
            }
          : undefined,
      };
    });
  }

  public insertRowAfter() {
    const selection = this.selection;
    if (!selection) {
      return;
    }
    const id = this.view.addCard(
      { before: false, id: selection.cardId },
      selection.groupKey
    );
    requestAnimationFrame(() => {
      const columnId = this.view.header.titleColumn;
      this.selection = {
        groupKey: selection.groupKey,
        cardId: id,
        focus: columnId
          ? {
              columnId: columnId,
              isEditing: true,
            }
          : undefined,
      };
    });
  }

  public moveCard(rowId: string, key: string) {
    const selection = this.selection;
    if (!selection) {
      return;
    }
    this.view.groupHelper?.moveCardTo(rowId, selection.groupKey, key, 'start');
    requestAnimationFrame(() => {
      this.selection = {
        ...selection,
        groupKey: key,
      };
    });
  }
}

function getYOffset(srcRect: DOMRect, targetRect: DOMRect) {
  return Math.abs(
    srcRect.top +
      (srcRect.bottom - srcRect.top) / 2 -
      (targetRect.top + (targetRect.bottom - targetRect.top) / 2)
  );
}
