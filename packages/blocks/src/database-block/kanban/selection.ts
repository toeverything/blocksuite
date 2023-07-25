import type { KanbanCard } from './card.js';
import type { KanbanCell } from './cell.js';

export type KanbanFocusData = {
  columnId: string;
  isEditing: boolean;
};
export type KanbanSelectionData = {
  groupKey: string;
  cardId: string;
  focus?: KanbanFocusData;
};

export class KanbanSelection {
  _selection?: KanbanSelectionData;

  constructor(private ele: HTMLElement) {}

  get selection() {
    return this._selection;
  }

  set selection(state: KanbanSelectionData | undefined) {
    if (state && state.focus && state.focus.isEditing) {
      const cell = this.getFocusCellContainer(state);
      if (!cell?.cell?.beforeEnterEditMode()) {
        return;
      }
    }
    const old = this._selection;
    if (old && old.focus) {
      this.blur(old);
    }
    this._selection = state;
    if (state && state.focus) {
      this.focus(state);
    }
  }

  blur(selection: KanbanSelectionData) {
    if (!selection.focus) {
      return;
    }
    const container = this.getFocusCellContainer(selection);
    if (!container) {
      return;
    }
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

  focus(selection: KanbanSelectionData) {
    if (!selection.focus) {
      return;
    }
    const container = this.getFocusCellContainer(selection);
    if (!container) {
      return;
    }
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

  getSelectCard(selection: KanbanSelectionData) {
    return this.ele
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

  getFocusCellContainer(selection: KanbanSelectionData) {
    if (!selection.focus) {
      return;
    }
    const card = this.getSelectCard(selection);
    if (!card) {
      return;
    }
    return this.getFocusCellContainerByCard(card, selection.focus);
  }
}
