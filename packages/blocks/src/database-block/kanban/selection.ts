import type { Disposable } from '@blocksuite/global/utils';

import type {
  KanbanFocusData,
  KanbanViewSelection,
} from '../../__internal__/index.js';
import type { KanbanCard } from './card.js';
import { KanbanCell } from './cell.js';
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

  getSelectCard(selection: KanbanViewSelection) {
    return this.viewEle
      .querySelector(
        `affine-data-view-kanban-group[data-key="${selection.groupKey}"]`
      )
      ?.querySelector(
        `affine-data-view-kanban-card[data-card-id="${selection.cardId}"]`
      ) as KanbanCard | undefined;
  }

  getFocusCellContainerByCard(card: KanbanCard, focus: KanbanFocusData) {
    return card.querySelector(
      `affine-data-view-kanban-cell[data-column-id="${focus.columnId}"]`
    ) as KanbanCell | undefined;
  }

  getFocusCellContainer(selection: KanbanViewSelection) {
    if (!selection.focus) {
      return;
    }
    const card = this.getSelectCard(selection);
    if (!card) {
      return;
    }
    return this.getFocusCellContainerByCard(card, selection.focus);
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
    const selection = this.selection;
    if (!selection || selection.focus?.isEditing) {
      return;
    }
    if (selection.focus) {
      const preContainer =
        this.getFocusCellContainer(selection)?.previousElementSibling;
      if (preContainer instanceof KanbanCell) {
        this.selection = {
          ...selection,
          focus: {
            ...selection.focus,
            columnId: preContainer.column.id,
          },
        };
      }
    }
  }

  public focusDown() {
    const selection = this.selection;
    if (!selection || selection.focus?.isEditing) {
      return;
    }
    if (selection.focus) {
      const nextContainer =
        this.getFocusCellContainer(selection)?.nextElementSibling;
      if (nextContainer instanceof KanbanCell) {
        this.selection = {
          ...selection,
          focus: {
            ...selection.focus,
            columnId: nextContainer.column.id,
          },
        };
      }
    }
  }

  public focusLeft() {
    //
  }

  public focusRight() {
    //
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
      this.selection = {
        groupKey: selection.groupKey,
        cardId: id,
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
      this.selection = {
        groupKey: selection.groupKey,
        cardId: id,
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
