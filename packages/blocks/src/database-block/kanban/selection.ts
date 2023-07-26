import type {
  KanbanFocusData,
  KanbanViewSelection,
} from '../../__internal__/index.js';
import type { KanbanCard } from './card.js';
import type { KanbanCell } from './cell.js';
import type { DataViewKanban } from './kanban-view.js';

export class KanbanSelection {
  _selection?: KanbanViewSelection;

  constructor(private viewEle: DataViewKanban) {}

  get selection() {
    return this._selection;
  }

  set selection(state: KanbanViewSelection | undefined) {
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

  blur(selection: KanbanViewSelection) {
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

  focus(selection: KanbanViewSelection) {
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
}
