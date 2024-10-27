import { ShadowlessElement } from '@blocksuite/block-std';
import {
  assertExists,
  SignalWatcher,
  WithDisposable,
} from '@blocksuite/global/utils';
import { computed } from '@preact/signals-core';
import { css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';

import type {
  CellRenderProps,
  DataViewCellLifeCycle,
} from '../../core/property/index.js';
import type { SingleView } from '../../core/view-manager/single-view.js';
import type { TableColumn } from './table-view-manager.js';

import { renderUniLit } from '../../core/index.js';
import {
  TableAreaSelection,
  type TableViewSelectionWithType,
} from './types.js';

export class DatabaseCellContainer extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    affine-database-cell-container {
      display: flex;
      align-items: start;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
    }

    affine-database-cell-container * {
      box-sizing: border-box;
    }

    affine-database-cell-container uni-lit > *:first-child {
      padding: 8px;
    }
  `;

  private _cell = createRef<DataViewCellLifeCycle>();

  cell$ = computed(() => {
    return this.column.cellGet(this.rowId);
  });

  selectCurrentCell = (editing: boolean) => {
    if (this.view.readonly$.value) {
      return;
    }
    const selectionView = this.selectionView;
    if (selectionView) {
      const selection = selectionView.selection;
      if (selection && this.isSelected(selection) && editing) {
        selectionView.selection = TableAreaSelection.create({
          groupKey: this.groupKey,
          focus: {
            rowIndex: this.rowIndex,
            columnIndex: this.columnIndex,
          },
          isEditing: true,
        });
      } else {
        selectionView.selection = TableAreaSelection.create({
          groupKey: this.groupKey,
          focus: {
            rowIndex: this.rowIndex,
            columnIndex: this.columnIndex,
          },
          isEditing: false,
        });
      }
    }
  };

  get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

  private get groupKey() {
    return this.closest('affine-data-view-table-group')?.group?.key;
  }

  private get readonly() {
    return this.column.readonly$.value;
  }

  private get selectionView() {
    return this.closest('affine-database-table')?.selectionController;
  }

  get table() {
    const table = this.closest('affine-database-table');
    assertExists(table);
    return table;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'click', () => {
      if (!this.isEditing) {
        this.selectCurrentCell(!this.column.readonly$.value);
      }
    });
  }

  isSelected(selection: TableViewSelectionWithType) {
    if (selection.selectionType !== 'area') {
      return false;
    }
    if (selection.groupKey !== this.groupKey) {
      return;
    }
    if (selection.focus.columnIndex !== this.columnIndex) {
      return;
    }
    return selection.focus.rowIndex === this.rowIndex;
  }

  override render() {
    const renderer = this.column.renderer$.value;
    if (!renderer) {
      return;
    }
    const { edit, view } = renderer;
    const uni = !this.readonly && this.isEditing && edit != null ? edit : view;
    const props: CellRenderProps = {
      cell: this.cell$.value,
      isEditing: this.isEditing,
      selectCurrentCell: this.selectCurrentCell,
    };

    return renderUniLit(uni, props, {
      ref: this._cell,
      style: {
        display: 'contents',
      },
    });
  }

  @property({ attribute: false })
  accessor column!: TableColumn;

  @property({ attribute: false })
  accessor columnId!: string;

  @property({ attribute: false })
  accessor columnIndex!: number;

  @state()
  accessor isEditing = false;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor rowIndex!: number;

  @property({ attribute: false })
  accessor view!: SingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-cell-container': DatabaseCellContainer;
  }
}
