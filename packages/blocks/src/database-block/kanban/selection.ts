import { assertExists, type Disposable } from '@blocksuite/global/utils';

import type { KanbanViewSelection } from '../../__internal__/index.js';
import { KanbanCard } from './card.js';
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
      const container = getFocusCell(this.viewEle, selection);
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
      const selectCard = getFocusCard(this.viewEle, selection);
      if (selectCard) {
        selectCard.isFocus = false;
      }
      return;
    }
    const container = getFocusCell(this.viewEle, selection);
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
      const selectCard = getFocusCard(this.viewEle, selection);
      if (selectCard) {
        selectCard.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        selectCard.isFocus = true;
      }
      return;
    }
    const container = getFocusCell(this.viewEle, selection);
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

  getNextFocusCell(
    selection: KanbanViewSelection,
    index: number,
    nextPosition: 'up' | 'down' | 'left' | 'right'
  ): {
    cell: KanbanCell;
    cardId?: string;
    groupKey?: string;
  } {
    const kanbanCells = getCardCellsBySelection(this.viewEle, selection);

    if (nextPosition === 'up') {
      const nextIndex = index - 1;
      if (nextIndex < 0) {
        const cards = getGroupCardsBySelection(this.viewEle, selection);
        return getNextCardFocusCell(
          nextPosition,
          cards,
          selection,
          cardIndex => (cardIndex === 0 ? cards.length - 1 : cardIndex - 1)
        );
      }
      return {
        cell: kanbanCells[nextIndex],
      };
    }

    if (nextPosition === 'down') {
      const nextIndex = index + 1;
      if (nextIndex >= kanbanCells.length) {
        const cards = getGroupCardsBySelection(this.viewEle, selection);
        return getNextCardFocusCell(
          nextPosition,
          cards,
          selection,
          cardIndex => (cardIndex === cards.length - 1 ? 0 : cardIndex + 1)
        );
      }
      return {
        cell: kanbanCells[nextIndex],
      };
    }

    const groups = Array.from(
      this.viewEle.querySelectorAll('affine-data-view-kanban-group')
    );

    if (nextPosition === 'right') {
      return getNextGroupFocusElement(
        'cell',
        this.viewEle,
        groups,
        selection,
        groupIndex => (groupIndex === groups.length - 1 ? 0 : groupIndex + 1)
      );
    }

    if (nextPosition === 'left') {
      return getNextGroupFocusElement(
        'cell',
        this.viewEle,
        groups,
        selection,
        groupIndex => (groupIndex === 0 ? groups.length - 1 : groupIndex - 1)
      );
    }

    throw new Error(
      'Unknown arrow keys, only support: up, down, left, and right keys.'
    );
  }

  getNextFocusCard(
    selection: KanbanViewSelection,
    index: number,
    nextPosition: 'up' | 'down' | 'left' | 'right'
  ): { card: KanbanCard; cardId: string; groupKey?: string } {
    const kanbanCards = getGroupCardsBySelection(this.viewEle, selection);

    if (nextPosition === 'up') {
      const nextIndex = index - 1;
      const nextCardIndex = nextIndex < 0 ? kanbanCards.length - 1 : nextIndex;
      const card = kanbanCards[nextCardIndex];

      return {
        card,
        cardId: card.cardId,
      };
    }

    if (nextPosition === 'down') {
      const nextIndex = index + 1;
      const nextCardIndex = nextIndex > kanbanCards.length - 1 ? 0 : nextIndex;
      const card = kanbanCards[nextCardIndex];

      return {
        card,
        cardId: card.cardId,
      };
    }

    const groups = Array.from(
      this.viewEle.querySelectorAll('affine-data-view-kanban-group')
    );

    if (nextPosition === 'right') {
      return getNextGroupFocusElement(
        'card',
        this.viewEle,
        groups,
        selection,
        groupIndex => (groupIndex === groups.length - 1 ? 0 : groupIndex + 1)
      );
    }

    if (nextPosition === 'left') {
      return getNextGroupFocusElement(
        'card',
        this.viewEle,
        groups,
        selection,
        groupIndex => (groupIndex === 0 ? groups.length - 1 : groupIndex - 1)
      );
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
      // cell focus
      const kanbanCells = getCardCellsBySelection(this.viewEle, selection);
      const index = kanbanCells.findIndex(
        cell => cell.column.id === selection.focus?.columnId
      );
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
    } else {
      // card focus
      const cards = getGroupCardsBySelection(this.viewEle, selection);
      const index = cards.findIndex(card => card.cardId === selection.cardId);
      const { card, cardId, groupKey } = this.getNextFocusCard(
        selection,
        index,
        position
      );
      if (card instanceof KanbanCard) {
        this.selection = {
          ...selection,
          focus: undefined,
          cardId: cardId ?? selection.cardId,
          groupKey: groupKey ?? selection.groupKey,
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
      const card = getFocusCard(this.viewEle, selection);
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

type NextFocusCell = {
  cell: KanbanCell;
  cardId: string;
  groupKey: string;
};
type NextFocusCard = {
  card: KanbanCard;
  cardId: string;
  groupKey: string;
};
function getNextGroupFocusElement(
  type: 'cell',
  viewElement: Element,
  groups: KanbanGroup[],
  selection: KanbanViewSelection,
  getNextGroupIndex: (groupIndex: number) => number
): NextFocusCell;
function getNextGroupFocusElement(
  type: 'card',
  viewElement: Element,
  groups: KanbanGroup[],
  selection: KanbanViewSelection,
  getNextGroupIndex: (groupIndex: number) => number
): NextFocusCard;
function getNextGroupFocusElement<T extends 'cell' | 'card'>(
  type: T,
  viewElement: Element,
  groups: KanbanGroup[],
  selection: KanbanViewSelection,
  getNextGroupIndex: (groupIndex: number) => number
): NextFocusCell | NextFocusCard {
  const groupIndex = groups.findIndex(
    group => group.group.key === selection.groupKey
  );

  const nextGroupIndex = getNextGroupIndex(groupIndex);

  const nextGroup = groups[nextGroupIndex];
  const element = (type === 'cell' ? getFocusCell : getFocusCard)(
    viewElement,
    selection
  );
  assertExists(element);
  const rect = element.getBoundingClientRect();
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

  if (type === 'card') {
    return {
      card: nextCard,
      cardId: nextCard.cardId,
      groupKey: nextGroup.group.key,
    };
  }

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
    cardId: nextCard.cardId,
    groupKey: nextGroup.group.key,
  };
}

function getNextCardFocusCell(
  nextPosition: 'up' | 'down',
  cards: KanbanCard[],
  selection: KanbanViewSelection,
  getNextCardIndex: (cardIndex: number) => number
): {
  cell: KanbanCell;
  cardId: string;
} {
  const cardIndex = cards.findIndex(card => card.cardId === selection.cardId);
  const nextCardIndex = getNextCardIndex(cardIndex);
  const nextCard = cards[nextCardIndex];
  const nextCells = Array.from(
    nextCard.querySelectorAll('affine-data-view-kanban-cell')
  );
  const nextCellIndex = nextPosition === 'up' ? nextCells.length - 1 : 0;
  return {
    cell: nextCells[nextCellIndex],
    cardId: nextCard.cardId,
  };
}

function getGroupCardsBySelection(
  viewElement: Element,
  selection: KanbanViewSelection
) {
  const group = viewElement.querySelector(
    `affine-data-view-kanban-group[data-key="${selection?.groupKey}"]`
  );
  return Array.from(
    group?.querySelectorAll('affine-data-view-kanban-card') ?? []
  );
}

function getCardCellsBySelection(
  viewElement: Element,
  selection: KanbanViewSelection
) {
  const card = getFocusCard(viewElement, selection);
  return Array.from(
    card?.querySelectorAll('affine-data-view-kanban-cell') ?? []
  );
}

function getFocusCard(viewElement: Element, selection: KanbanViewSelection) {
  const group = viewElement.querySelector(
    `affine-data-view-kanban-group[data-key="${selection.groupKey}"]`
  );
  if (!group) return null;
  return group.querySelector<KanbanCard>(
    `affine-data-view-kanban-card[data-card-id="${selection.cardId}"]`
  );
}

function getFocusCell(viewElement: Element, selection: KanbanViewSelection) {
  if (!selection.focus) {
    return null;
  }
  const card = getFocusCard(viewElement, selection);
  if (!card) {
    return null;
  }
  return card.querySelector<KanbanCell>(
    `affine-data-view-kanban-cell[data-column-id="${selection.focus.columnId}"]`
  );
}

function getYOffset(srcRect: DOMRect, targetRect: DOMRect) {
  return Math.abs(
    srcRect.top +
      (srcRect.bottom - srcRect.top) / 2 -
      (targetRect.top + (targetRect.bottom - targetRect.top) / 2)
  );
}
