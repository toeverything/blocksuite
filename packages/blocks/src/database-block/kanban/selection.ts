import { assertExists, type Disposable } from '@blocksuite/global/utils';

import type {
  KanbanCardSelection,
  KanbanCardSelectionCard,
  KanbanCellSelection,
  KanbanGroupSelection,
  KanbanViewSelection,
  KanbanViewSelectionWithType,
} from '../../__internal__/index.js';
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

  run(): Disposable[] {
    return [
      this.viewEle.selectionUpdated.on(selection => {
        const old = this._selection;
        if (old) {
          this.blur(old);
        }
        this._selection = selection;
        if (selection) {
          this.focus(selection);
        }
      }),
    ];
  }

  get selection(): KanbanViewSelection | undefined {
    return this._selection;
  }

  set selection(data: KanbanViewSelection | undefined) {
    if (!data) {
      this.viewEle.setSelection();
      return;
    }
    const selection: KanbanViewSelectionWithType = {
      ...data,
      viewId: this.viewEle.view.id,
      type: 'kanban',
    };

    if (selection.selectionType === 'cell' && selection.isEditing) {
      const container = getFocusCell(this.viewEle, selection);
      const cell = container?.cell;
      const isEditing = cell
        ? cell.beforeEnterEditMode()
          ? selection.isEditing
          : false
        : false;
      this.viewEle.setSelection({
        ...selection,
        isEditing,
      });
    } else {
      this.viewEle.setSelection(selection);
    }
  }

  public shiftClickCard = (event: MouseEvent) => {
    event.preventDefault();

    const selection = this.selection;
    const target = event.target as HTMLElement;
    const closestCardId = target.closest('affine-data-view-kanban-card')
      ?.cardId;
    const closestGroupKey = target.closest('affine-data-view-kanban-group')
      ?.group.key;
    if (!closestCardId) return;
    if (!closestGroupKey) return;
    const cards = selection?.selectionType === 'card' ? selection.cards : [];

    const newCards =
      cards.findIndex(card => card.cardId === closestCardId) >= 0
        ? cards.filter(card => card.cardId !== closestCardId)
        : [...cards, { cardId: closestCardId, groupKey: closestGroupKey }];
    this.selection = atLastOne(newCards)
      ? {
          selectionType: 'card',
          cards: newCards,
        }
      : undefined;
  };

  blur(selection: KanbanViewSelection) {
    if (selection.selectionType !== 'cell') {
      const selectCards = getSelectedCards(this.viewEle, selection);
      selectCards.forEach(card => (card.isFocus = false));
      return;
    }
    const container = getFocusCell(this.viewEle, selection);
    if (!container) {
      return;
    }
    container.isFocus = false;
    const cell = container?.cell;

    if (selection.isEditing) {
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
    if (selection.selectionType !== 'cell') {
      const selectCards = getSelectedCards(this.viewEle, selection);
      selectCards.forEach((card, index) => {
        if (index === 0) {
          card.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
        card.isFocus = true;
      });
      return;
    }
    const container = getFocusCell(this.viewEle, selection);
    if (!container) {
      return;
    }
    container.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    container.isFocus = true;
    const cell = container?.cell;
    if (selection.isEditing) {
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
    selection: KanbanCellSelection,
    index: number,
    nextPosition: 'up' | 'down' | 'left' | 'right'
  ): {
    cell: KanbanCell;
    cardId?: string;
    groupKey?: string;
  } {
    const kanbanCells = getCardCellsBySelection(this.viewEle, selection);
    const group = this.viewEle.querySelector(
      `affine-data-view-kanban-group[data-key="${selection.groupKey}"]`
    );
    const cards = Array.from(
      group?.querySelectorAll('affine-data-view-kanban-card') ?? []
    );

    if (nextPosition === 'up') {
      const nextIndex = index - 1;
      if (nextIndex < 0) {
        if (cards.length > 1) {
          return getNextCardFocusCell(
            nextPosition,
            cards,
            selection,
            cardIndex => (cardIndex === 0 ? cards.length - 1 : cardIndex - 1)
          );
        } else {
          return {
            cell: kanbanCells[kanbanCells.length - 1],
          };
        }
      }
      return {
        cell: kanbanCells[nextIndex],
      };
    }

    if (nextPosition === 'down') {
      const nextIndex = index + 1;
      if (nextIndex >= kanbanCells.length) {
        if (cards.length > 1) {
          return getNextCardFocusCell(
            nextPosition,
            cards,
            selection,
            cardIndex => (cardIndex === cards.length - 1 ? 0 : cardIndex + 1)
          );
        } else {
          return {
            cell: kanbanCells[0],
          };
        }
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
    selection: KanbanCardSelection,
    index: number,
    nextPosition: 'up' | 'down' | 'left' | 'right'
  ): { card: KanbanCard; cards: KanbanCardSelectionCard[] } {
    const group = this.viewEle.querySelector(
      `affine-data-view-kanban-group[data-key="${selection.cards[0].groupKey}"]`
    );
    const kanbanCards = Array.from(
      group?.querySelectorAll('affine-data-view-kanban-card') ?? []
    );

    if (nextPosition === 'up') {
      const nextIndex = index - 1;
      const nextCardIndex = nextIndex < 0 ? kanbanCards.length - 1 : nextIndex;
      const card = kanbanCards[nextCardIndex];

      return {
        card,
        cards: [
          {
            cardId: card.cardId,
            groupKey: card.groupKey,
          },
        ],
      };
    }

    if (nextPosition === 'down') {
      const nextIndex = index + 1;
      const nextCardIndex = nextIndex > kanbanCards.length - 1 ? 0 : nextIndex;
      const card = kanbanCards[nextCardIndex];

      return {
        card,
        cards: [
          {
            cardId: card.cardId,
            groupKey: card.groupKey,
          },
        ],
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
    if (!selection) {
      return;
    }

    if (selection.selectionType === 'cell' && !selection.isEditing) {
      // cell focus
      const kanbanCells = getCardCellsBySelection(this.viewEle, selection);
      const index = kanbanCells.findIndex(
        cell => cell.column.id === selection.columnId
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
          columnId: cell.column.id,
        } satisfies KanbanCellSelection;
      }
    } else if (selection.selectionType === 'card') {
      // card focus
      const group = this.viewEle.querySelector(
        `affine-data-view-kanban-group[data-key="${selection.cards[0].groupKey}"]`
      );
      const cardElements = Array.from(
        group?.querySelectorAll('affine-data-view-kanban-card') ?? []
      );

      const index = cardElements.findIndex(
        card => card.cardId === selection.cards[0].cardId
      );
      const { card, cards } = this.getNextFocusCard(selection, index, position);
      if (card instanceof KanbanCard) {
        const newCards = cards ?? selection.cards;
        this.selection = atLastOne(newCards)
          ? {
              ...selection,
              cards: newCards,
            }
          : undefined;
      }
    }
  }

  public focusOut() {
    const selection = this.selection;
    if (selection?.selectionType === 'card') {
      if (atLastOne(selection.cards)) {
        this.selection = {
          ...selection,
          cards: [selection.cards[0]],
        };
      } else {
        // Not yet implement
        return;
      }
    }
    if (selection?.selectionType !== 'cell') {
      return;
    }

    if (selection.isEditing) {
      this.selection = {
        ...selection,
        isEditing: false,
      };
    } else {
      this.selection = {
        selectionType: 'card',
        cards: [
          {
            cardId: selection.cardId,
            groupKey: selection.groupKey,
          },
        ],
      };
    }
  }

  public focusIn() {
    const selection = this.selection;
    if (!selection) return;
    if (selection.selectionType === 'cell' && selection.isEditing) return;

    if (selection.selectionType === 'cell') {
      this.selection = {
        ...selection,
        isEditing: true,
      };
      return;
    }
    if (selection.selectionType === 'card') {
      const card = getSelectedCards(this.viewEle, selection)[0];
      const cell = card?.querySelector('affine-data-view-kanban-cell');
      if (cell) {
        this.selection = {
          groupKey: card.groupKey,
          cardId: card.cardId,
          selectionType: 'cell',
          columnId: cell.column.id,
          isEditing: false,
        };
      }
    } else {
      // Not yet implement
    }
  }

  public deleteCard() {
    const selection = this.selection;
    if (!selection || selection.selectionType === 'cell') {
      return;
    }
    if (selection.selectionType === 'card') {
      this.viewEle.view.rowDelete(selection.cards.map(v => v.cardId));
      this.selection = undefined;
    }
  }

  focusFirstCell() {
    const group = this.viewEle.groupHelper?.groups[0];
    const card = group?.rows[0];
    const columnId = card && this.viewEle.view.getHeaderTitle(card)?.id;
    if (group && card && columnId) {
      this.selection = {
        groupKey: group.key,
        cardId: card,
        columnId,
        isEditing: true,
      } as KanbanCellSelection;
    }
  }

  public insertRowBefore() {
    const selection = this.selection;
    if (selection?.selectionType !== 'card') {
      return;
    }

    const { cardId, groupKey } = selection.cards[0];
    const id = this.view.addCard({ before: true, id: cardId }, groupKey);

    requestAnimationFrame(() => {
      const columnId = this.view.header.titleColumn;
      if (columnId) {
        this.selection = {
          selectionType: 'cell',
          groupKey,
          cardId: id,
          columnId,
          isEditing: true,
        } as KanbanCellSelection;
      } else {
        this.selection = {
          selectionType: 'card',
          cards: [
            {
              cardId: id,
              groupKey,
            },
          ],
        };
      }
    });
  }

  public insertRowAfter() {
    const selection = this.selection;
    if (selection?.selectionType !== 'card') {
      return;
    }

    const { cardId, groupKey } = selection.cards[0];
    const id = this.view.addCard({ before: false, id: cardId }, groupKey);

    requestAnimationFrame(() => {
      const columnId = this.view.header.titleColumn;
      if (columnId) {
        this.selection = {
          selectionType: 'cell',
          groupKey,
          cardId: id,
          columnId,
          isEditing: true,
        } as KanbanCellSelection;
      } else {
        this.selection = {
          selectionType: 'card',
          cards: [
            {
              cardId: id,
              groupKey,
            },
          ],
        } as KanbanCardSelection;
      }
    });
  }

  public moveCard(rowId: string, key: string) {
    const selection = this.selection;
    if (selection?.selectionType !== 'card') {
      return;
    }
    this.view.groupHelper?.moveCardTo(
      rowId,
      selection.cards[0].groupKey,
      key,
      'start'
    );
    requestAnimationFrame(() => {
      if (this.selection?.selectionType !== 'card') return;

      const newCards = selection.cards.map(card => ({
        ...card,
        groupKey: card.groupKey,
      }));
      this.selection = atLastOne(newCards)
        ? {
            ...selection,
            cards: newCards,
          }
        : undefined;
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
  cards: {
    cardId: string;
    groupKey: string;
  }[];
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
  const groupIndex = groups.findIndex(group => {
    if (type === 'cell') {
      return group.group.key === (selection as KanbanCellSelection).groupKey;
    }
    return (
      group.group.key === (selection as KanbanCardSelection).cards[0].groupKey
    );
  });

  const nextGroupIndex = getNextGroupIndex(groupIndex);

  const nextGroup = groups[nextGroupIndex];
  const element =
    type === 'cell'
      ? getFocusCell(viewElement, selection as KanbanCellSelection)
      : getSelectedCards(viewElement, selection as KanbanCardSelection)[0];
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
      cards: [
        {
          cardId: nextCard.cardId,
          groupKey: nextGroup.group.key,
        },
      ],
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
  selection: KanbanCellSelection,
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

function getCardCellsBySelection(
  viewElement: Element,
  selection: KanbanCellSelection
) {
  const card = getSelectedCard(viewElement, selection);
  return Array.from(
    card?.querySelectorAll('affine-data-view-kanban-cell') ?? []
  );
}

function getSelectedCard(
  viewElement: Element,
  selection: KanbanCellSelection
): KanbanCard | null {
  const group = viewElement.querySelector(
    `affine-data-view-kanban-group[data-key="${selection.groupKey}"]`
  );

  if (!group) return null;
  return group.querySelector<KanbanCard>(
    `affine-data-view-kanban-card[data-card-id="${selection.cardId}"]`
  );
}

function getSelectedCards(
  viewElement: Element,
  selection: KanbanCardSelection | KanbanGroupSelection
): KanbanCard[] {
  if (selection.selectionType === 'group') return [];

  const groupKeys = selection.cards.map(card => card.groupKey);
  const groups = groupKeys
    .map(key =>
      viewElement.querySelector(
        `affine-data-view-kanban-group[data-key="${key}"]`
      )
    )
    .filter((group): group is Element => group !== null);

  const cardIds = selection.cards.map(card => card.cardId);
  const cards = groups
    .flatMap(group =>
      cardIds.map(id =>
        group.querySelector<KanbanCard>(
          `affine-data-view-kanban-card[data-card-id="${id}"]`
        )
      )
    )
    .filter((card): card is KanbanCard => card !== null);

  return cards;
}

function getFocusCell(viewElement: Element, selection: KanbanCellSelection) {
  const card = getSelectedCard(viewElement, selection);
  return card?.querySelector<KanbanCell>(
    `affine-data-view-kanban-cell[data-column-id="${selection.columnId}"]`
  );
}

function getYOffset(srcRect: DOMRect, targetRect: DOMRect) {
  return Math.abs(
    srcRect.top +
      (srcRect.bottom - srcRect.top) / 2 -
      (targetRect.top + (targetRect.bottom - targetRect.top) / 2)
  );
}
const atLastOne = <T>(v: T[]): v is [T, ...T[]] => {
  return v.length > 0;
};
