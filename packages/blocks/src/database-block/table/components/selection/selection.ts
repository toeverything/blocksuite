import type { UIEventDispatcher } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';

import { getService } from '../../../../__internal__/service.js';
import { activeEditorManager } from '../../../../__internal__/utils/active-editor-manager.js';
import type {
  CellFocus,
  DatabaseSelection,
  MultiSelection,
} from '../../../../__internal__/utils/types.js';
import { startDrag } from '../../../utils/drag.js';
import type { DataViewTableManager } from '../../table-view-manager.js';
import type { DatabaseCellContainer } from '../cell-container.js';

const hotkeys = {
  Backspace: 'Backspace',
  Enter: 'Enter',
  Escape: 'Escape',
  ArrowUp: 'ArrowUp',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ArrowDown: 'ArrowDown',
  Tab: 'Tab',
} as const;

@customElement('affine-database-selection')
export class DatabaseSelectionView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .database-selection {
      position: absolute;
      z-index: 1;
      box-sizing: border-box;
      background: var(--affine-primary-color-04);
      pointer-events: none;
      display: none;
    }

    .database-focus {
      position: absolute;
      width: 100%;
      z-index: 1;
      box-sizing: border-box;
      border: 2px solid var(--affine-primary-color) !important;
      border-radius: 2px;
      pointer-events: none;
      display: none;
      outline: none;
    }
  `;

  @property()
  blockId!: string;
  @property({ attribute: false })
  view!: DataViewTableManager;
  @property({ attribute: false })
  eventDispatcher!: UIEventDispatcher;

  private service = getService('affine:database');

  private focusRef = createRef<HTMLDivElement>();
  private selectionRef = createRef<HTMLDivElement>();

  get tableContainer() {
    const tableContainer = this.parentElement;
    assertExists(tableContainer);
    return tableContainer;
  }

  isCurrentDatabase(ele: Element): boolean {
    return ele.closest('affine-database') === this.closest('affine-database');
  }

  isInTableBody(ele: Element) {
    return !!ele.closest('.affine-database-block-rows');
  }

  /**
   * @deprecated
   */
  isStartInDatabase = false;

  override firstUpdated() {
    this._disposables.add(
      this.service.slots.databaseSelectionUpdated.on(({ selection, old }) => {
        if (!activeEditorManager.isActive(this)) {
          return;
        }
        if (selection?.databaseId !== this.blockId) {
          selection = undefined;
        }
        this.updateSelectionStyle(
          selection?.rowsSelection,
          selection?.columnsSelection
        );

        const isRowSelection =
          selection?.rowsSelection && !selection?.columnsSelection;
        this.updateFocusSelectionStyle(
          selection?.focus,
          isRowSelection,
          selection?.isEditing
        );
        if (old && old.databaseId === this.blockId) {
          const container = this.getCellContainer(
            old.focus.rowIndex,
            old.focus.columnIndex
          );
          if (container) {
            const cell = container.cell;
            if (old.isEditing) {
              cell?.onExitEditMode();
              if (cell?.blurCell()) {
                container.blur();
              }
              container.isEditing = false;
            } else {
              container.blur();
            }
          }
        }

        if (selection && selection.databaseId === this.blockId) {
          const container = this.getCellContainer(
            selection.focus.rowIndex,
            selection.focus.columnIndex
          );
          if (container) {
            const cell = container.cell;
            if (selection.isEditing) {
              cell?.onEnterEditMode();
              container.isEditing = true;
              if (cell?.focusCell()) {
                container.focus();
              }
            } else {
              container.focus();
            }
          }
        }
      })
    );
    this._disposables.add({
      dispose: this.eventDispatcher.add('dragStart', context => {
        const event = context.get('pointerState').event;
        const target = event.target;
        if (
          event instanceof MouseEvent &&
          target instanceof Element &&
          this.isCurrentDatabase(target)
        ) {
          const cell = target.closest('affine-database-cell-container');
          if (cell) {
            const selection = this.selection;
            if (
              selection &&
              selection.isEditing &&
              selection.focus.rowIndex === cell.rowIndex &&
              selection.focus.columnIndex === cell.columnIndex
            ) {
              return false;
            }
            this.startDrag(event, cell);
          }
          return true;
        }
        return false;
      }),
    });
    this._disposables.addFromEvent(window, 'mousedown', event => {
      const target = event.target as Element;
      if (this.isInTableBody(target)) {
        return;
      }
      // TODO: refactor hardcoded here
      if (target.closest('affine-drag-handle')) {
        return;
      }
      this.selection = undefined;
    });
    this._disposables.add({
      dispose: this.eventDispatcher.add('keyDown', context => {
        const event = context.get('keyboardState').event;
        const selection = this.selection;
        if (
          selection &&
          selection.databaseId === this.blockId &&
          event instanceof KeyboardEvent
        ) {
          return this.onKeydown(selection, event);
        }
        return false;
      }),
    });
  }

  protected override updated() {
    this.checkSelection();
  }

  checkSelection() {
    const selection = this.selection;
    if (!selection || selection.databaseId !== this.blockId) {
      return;
    }
    if (selection.focus.rowIndex > this.view.rows.length - 1) {
      this.selection = undefined;
      return;
    }
    if (selection.focus.columnIndex > this.view.columns.length - 1) {
      this.selection = undefined;
      return;
    }
  }

  get selection(): DatabaseSelection | undefined {
    return this.service.getSelection();
  }

  set selection(data: Omit<DatabaseSelection, 'databaseId'> | undefined) {
    const selection = data ? { ...data, databaseId: this.blockId } : undefined;
    if (selection && selection.isEditing) {
      const focus = selection.focus;
      const container = this.getCellContainer(
        focus.rowIndex,
        focus.columnIndex
      );
      const cell = container?.cell;
      const isEditing = cell ? cell.beforeEnterEditMode() : true;
      this.service.select({
        ...selection,
        isEditing,
      });
      return;
    }
    this.service.select(selection);
  }

  cellPosition(left: number, top: number) {
    const rows = this.rows();
    const cells = rows
      .item(0)
      .querySelectorAll('affine-database-cell-container');
    const rowOffsets: number[] = Array.from(rows).map(
      v => v.getBoundingClientRect().top - top
    );
    const columnOffsets: number[] = Array.from(cells).map(
      v => v.getBoundingClientRect().left - left
    );
    return (x1: number, x2: number, y1: number, y2: number) => {
      const [startX, endX] = x1 < x2 ? [x1, x2] : [x2, x1];
      const [startY, endY] = y1 < y2 ? [y1, y2] : [y2, y1];
      const row: MultiSelection = { start: 0, end: 0 };
      const column: MultiSelection = { start: 0, end: 0 };
      for (let i = 0; i < rowOffsets.length; i++) {
        const offset = rowOffsets[i];
        if (offset < startY) {
          row.start = i;
        }
        if (offset < endY) {
          row.end = i;
        }
      }
      for (let i = 0; i < columnOffsets.length; i++) {
        const offset = columnOffsets[i];
        if (offset < startX) {
          column.start = i;
        }
        if (offset < endX) {
          column.end = i;
        }
      }
      return {
        row,
        column,
      };
    };
  }

  startDrag(evt: MouseEvent, cell: DatabaseCellContainer) {
    const table = this.tableContainer;
    const tableRect = table.getBoundingClientRect();
    const startOffsetX = evt.x - tableRect.left;
    const startOffsetY = evt.y - tableRect.top;
    const offsetToSelection = this.cellPosition(tableRect.left, tableRect.top);
    const select = (selection: {
      row: MultiSelection;
      column: MultiSelection;
    }) => {
      this.selection = {
        rowsSelection: selection.row,
        columnsSelection: selection.column,
        focus: {
          rowIndex: cell.rowIndex,
          columnIndex: cell.columnIndex,
        },
        isEditing: false,
      };
    };
    startDrag<
      | {
          row: MultiSelection;
          column: MultiSelection;
        }
      | undefined,
      {
        x: number;
        y: number;
      }
    >(evt, {
      transform: evt => ({ x: evt.x, y: evt.y }),
      onDrag: () => undefined,
      onMove: ({ x, y }) => {
        const currentOffsetX = x - tableRect.left;
        const currentOffsetY = y - tableRect.top;
        const selection = offsetToSelection(
          currentOffsetX,
          startOffsetX,
          currentOffsetY,
          startOffsetY
        );
        select(selection);
        return selection;
      },
      onDrop: selection => {
        if (!selection) {
          return;
        }
        select(selection);
      },
    });
  }

  private onKeydown(selection: DatabaseSelection, evt: KeyboardEvent): boolean {
    // TODO delete this stupid code
    if (
      !selection.isEditing &&
      evt.key === 'a' &&
      (evt.ctrlKey || evt.metaKey)
    ) {
      this.selection = undefined;
      return false;
    }
    const rowsSelection = selection.rowsSelection;
    if (evt.key === hotkeys.Backspace) {
      if (rowsSelection && !selection.columnsSelection) {
        const rows = this.view.rows.filter(
          (_, i) => i >= rowsSelection.start && i <= rowsSelection.end
        );
        this.view.rowDelete(rows);
        this.focusTo(rowsSelection.start - 1, selection.focus.columnIndex);
      }
    }
    if (evt.key === hotkeys.Escape) {
      if (selection.isEditing) {
        this.selection = {
          ...selection,
          isEditing: false,
        };
        return true;
      } else {
        if (rowsSelection && !selection.columnsSelection) {
          this.selection = {
            ...selection,
            rowsSelection: undefined,
            columnsSelection: undefined,
          };
        } else {
          this.selection = {
            ...selection,
            rowsSelection: {
              start: rowsSelection?.start ?? selection.focus.rowIndex,
              end: rowsSelection?.end ?? selection.focus.rowIndex,
            },
            columnsSelection: undefined,
          };
        }
      }
      return true;
    }
    if (selection.isEditing) {
      return true;
    }
    evt.preventDefault();
    if (evt.key === hotkeys.Enter) {
      this.selection = {
        ...selection,
        rowsSelection: undefined,
        columnsSelection: undefined,
        isEditing: true,
      };
      return true;
    }
    if (evt.shiftKey) {
      // TODO
      if (evt.key === hotkeys.ArrowRight) {
        return true;
      }
      if (evt.key === hotkeys.ArrowLeft) {
        return true;
      }
      if (evt.key === hotkeys.ArrowUp) {
        return true;
      }
      if (evt.key === hotkeys.ArrowDown) {
        return true;
      }
    }
    if (evt.key === hotkeys.Tab || evt.key === hotkeys.ArrowRight) {
      const length = this.view.columnManagerList.length;
      const column = selection.focus.columnIndex + 1;
      this.focusTo(
        selection.focus.rowIndex + (column >= length ? 1 : 0),
        column % length
      );
      return true;
    }
    if (evt.key === hotkeys.ArrowLeft) {
      const length = this.view.columnManagerList.length;
      const column = selection.focus.columnIndex - 1;
      this.focusTo(
        selection.focus.rowIndex + (column < 0 ? -1 : 0),
        column < 0 ? length - 1 : column
      );
      return true;
    }
    if (evt.key === hotkeys.ArrowUp) {
      this.focusTo(selection.focus.rowIndex - 1, selection.focus.columnIndex);
      return true;
    }
    if (evt.key === hotkeys.ArrowDown) {
      this.focusTo(selection.focus.rowIndex + 1, selection.focus.columnIndex);
      return true;
    }
    return false;
  }

  focusTo(rowIndex: number, columnIndex: number) {
    if (rowIndex < 0 || rowIndex >= this.view.rows.length) {
      return;
    }
    if (columnIndex < 0 || columnIndex >= this.view.columnManagerList.length) {
      return;
    }
    this.selection = {
      isEditing: false,
      focus: {
        rowIndex,
        columnIndex,
      },
    };
    this.focusRef.value?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
  }

  selectRange(
    selection: DatabaseSelection,
    row: MultiSelection,
    column: MultiSelection
  ) {
    this.selection = {
      ...selection,
      rowsSelection: row,
      columnsSelection: column,
      isEditing: false,
    };
  }

  getCellContainer(
    rowIndex: number,
    columnIndex: number
  ): DatabaseCellContainer | undefined {
    const row = this.rows().item(rowIndex);
    return row
      ?.querySelectorAll('affine-database-cell-container')
      .item(columnIndex);
  }

  private rows() {
    return this.tableContainer.querySelectorAll('.affine-database-block-row');
  }

  updateSelectionStyle(
    rowSelection?: MultiSelection,
    columnSelection?: MultiSelection
  ) {
    const div = this.selectionRef.value;
    assertExists(div);
    if (!rowSelection && !columnSelection) {
      div.style.display = 'none';
      return;
    }
    const tableRect = this.tableContainer.getBoundingClientRect();
    const { left, top, width, height, scale } = this.getRect(
      rowSelection?.start ?? 0,
      rowSelection?.end ?? this.view.rows.length - 1,
      columnSelection?.start ?? 0,
      columnSelection?.end ?? this.view.columnManagerList.length - 1
    );
    div.style.left = `${left - tableRect.left / scale}px`;
    div.style.top = `${top - tableRect.top / scale}px`;
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.display = 'block';
    const isRowSelection = rowSelection && !columnSelection;
    div.style.border = isRowSelection
      ? '2px solid var(--affine-primary-color)'
      : 'unset';
  }

  updateFocusSelectionStyle(
    focus?: CellFocus,
    isRowSelection?: boolean,
    isEditing = false
  ) {
    const div = this.focusRef.value;
    assertExists(div);
    if (focus && !isRowSelection) {
      const { left, top, width, height, scale } = this.getRect(
        focus.rowIndex,
        focus.rowIndex,
        focus.columnIndex,
        focus.columnIndex
      );
      const tableRect = this.tableContainer.getBoundingClientRect();
      div.style.left = `${left - tableRect.left / scale}px`;
      div.style.top = `${top - tableRect.top / scale}px`;
      div.style.width = `${width}px`;
      div.style.height = `${height}px`;
      div.style.borderColor = 'var(--affine-primary-color)';
      div.style.boxShadow = isEditing
        ? '0px 0px 0px 2px rgba(30, 150, 235, 0.30)'
        : 'unset';
      div.style.display = 'block';
    } else {
      div.style.display = 'none';
    }
  }

  getRect(top: number, bottom: number, left: number, right: number) {
    const rows = this.rows();
    const topRow = rows.item(top);
    const bottomRow = rows.item(bottom);
    const topCells = topRow.querySelectorAll('affine-database-cell-container');
    const leftCell = topCells.item(left);
    const rightCell = topCells.item(right);
    const leftRect = leftCell.getBoundingClientRect();
    const scale = leftRect.width / leftCell.column.width;
    return {
      top: leftRect.top / scale,
      left: leftRect.left / scale,
      width: (rightCell.getBoundingClientRect().right - leftRect.left) / scale,
      height: (bottomRow.getBoundingClientRect().bottom - leftRect.top) / scale,
      scale,
    };
  }

  public selectRow(index: number) {
    this.selection = {
      rowsSelection: { start: index, end: index },
      focus: { rowIndex: index, columnIndex: 0 },
      isEditing: false,
    };
  }

  public toggleRow(index: number) {
    const selection = this.selection;
    if (selection) {
      const rowsSelection = selection.rowsSelection;
      if (
        rowsSelection &&
        !selection.columnsSelection &&
        rowsSelection.start === index &&
        rowsSelection.end === index
      ) {
        this.selection = {
          ...selection,
          rowsSelection: undefined,
        };
        return;
      }
    }
    this.selection = {
      rowsSelection: { start: index, end: index },
      focus: { rowIndex: index, columnIndex: 0 },
      isEditing: false,
    };
  }

  override render() {
    return html`
      <div ${ref(this.selectionRef)} class="database-selection"></div>
      <div tabindex="0" ${ref(this.focusRef)} class="database-focus"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-selection': DatabaseSelectionView;
  }
}
