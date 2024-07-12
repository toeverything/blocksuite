import type { KanbanCard } from '../../view/presets/kanban/card.js';
import type { KanbanCardSelection } from '../../view/presets/kanban/types.js';
import type { RecordDetail } from './detail.js';

import { KanbanCell } from '../../view/presets/kanban/cell.js';
import { RecordField } from './field.js';

type DetailViewSelection = {
  isEditing: boolean;
  propertyId: string;
};

export class DetailSelection {
  _selection?: DetailViewSelection;

  onSelect = (selection?: DetailViewSelection) => {
    const old = this._selection;
    if (old) {
      this.blur(old);
    }
    this._selection = selection;
    if (selection) {
      this.focus(selection);
    }
  };

  constructor(private viewEle: RecordDetail) {}

  blur(selection: DetailViewSelection) {
    const container = this.getFocusCellContainer(selection);
    if (!container) {
      return;
    }

    container.isFocus = false;
    const cell = container.cell;

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

  deleteProperty() {
    //
  }

  focus(selection: DetailViewSelection) {
    const container = this.getFocusCellContainer(selection);
    if (!container) {
      return;
    }
    container.isFocus = true;
    const cell = container.cell;
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

  focusDown() {
    const selection = this.selection;
    if (!selection || selection?.isEditing) {
      return;
    }
    const nextContainer =
      this.getFocusCellContainer(selection)?.nextElementSibling;
    if (nextContainer instanceof KanbanCell) {
      this.selection = {
        isEditing: false,
        propertyId: nextContainer.column.id,
      };
    }
  }

  focusFirstCell() {
    const firstId = this.viewEle.querySelector('affine-data-view-record-field')
      ?.column.id;
    if (firstId) {
      this.selection = {
        isEditing: true,
        propertyId: firstId,
      };
    }
  }

  focusUp() {
    const selection = this.selection;
    if (!selection || selection?.isEditing) {
      return;
    }
    const preContainer =
      this.getFocusCellContainer(selection)?.previousElementSibling;
    if (preContainer instanceof RecordField) {
      this.selection = {
        isEditing: false,
        propertyId: preContainer.column.id,
      };
    }
  }

  getFocusCellContainer(selection: DetailViewSelection) {
    return this.viewEle.querySelector(
      `affine-data-view-record-field[data-column-id="${selection.propertyId}"]`
    ) as RecordField | undefined;
  }

  getSelectCard(selection: KanbanCardSelection) {
    const { cardId, groupKey } = selection.cards[0];

    return this.viewEle
      .querySelector(`affine-data-view-kanban-group[data-key="${groupKey}"]`)
      ?.querySelector(
        `affine-data-view-kanban-card[data-card-id="${cardId}"]`
      ) as KanbanCard | undefined;
  }

  get selection(): DetailViewSelection | undefined {
    return this._selection;
  }

  set selection(selection: DetailViewSelection | undefined) {
    if (!selection) {
      this.onSelect();
      return;
    }
    if (selection.isEditing) {
      const container = this.getFocusCellContainer(selection);
      const cell = container?.cell;
      const isEditing = cell
        ? cell.beforeEnterEditMode()
          ? selection.isEditing
          : false
        : false;
      this.onSelect({
        isEditing,
        propertyId: selection.propertyId,
      });
    } else {
      this.onSelect(selection);
    }
  }
}
