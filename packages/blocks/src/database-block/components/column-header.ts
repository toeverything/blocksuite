import {
  DatabaseAddColumn,
  DatabaseMultiSelect,
  DatabaseNumber,
  DatabaseProgress,
  DatabaseSelect,
  TextIcon,
} from '@blocksuite/global/config';
import { type Column, ColumnInsertPosition } from '@blocksuite/global/database';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import { createPopper } from '@popperjs/core';
import { css, type TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { getDefaultPage } from '../../__internal__/index.js';
import { ShadowlessElement } from '../../__internal__/utils/lit.js';
import { EditColumnPopup } from '../components/edit-column-popup.js';
import {
  DEFAULT_ADD_BUTTON_WIDTH,
  DEFAULT_COLUMN_MIN_WIDTH,
  DEFAULT_COLUMN_TITLE_HEIGHT,
} from '../consts.js';
import type { DatabaseBlockModel } from '../database-model.js';
import { onClickOutside } from '../utils.js';

const columnTypeIconMap: Record<string, TemplateResult> = {
  select: DatabaseSelect,
  number: DatabaseNumber,
  progress: DatabaseProgress,
  'rich-text': TextIcon,
  'multi-select': DatabaseMultiSelect,
};

type ColumnWidthConfig = {
  index: number;
  rafId?: number;
  rawWidth: number;
  scrollLeft: number;
  lastClientX: number;
  startClientX: number;
  currentCell: HTMLElement;
  rowCells: HTMLElement[];
};

const styles = css`
  .affine-database-column-header {
    position: relative;
    display: flex;
    flex-direction: row;
    height: 40px;
    border-bottom: 1px solid var(--affine-border-color);
  }
  .affine-database-column-header > .affine-database-column:first-child {
    background: rgba(0, 0, 0, 0.04);
  }

  .affine-database-column {
    position: relative;
    z-index: 1;
    transform: translateX(0);
  }
  .database-cell {
    min-width: ${DEFAULT_COLUMN_MIN_WIDTH}px;
  }
  .database-cell.add-column-button {
    width: auto;
    min-width: ${DEFAULT_ADD_BUTTON_WIDTH}px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .affine-database-column-content {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 8px;
    border-right: 1px solid var(--affine-border-color);
  }
  .affine-database-column:last-child .affine-database-column-content {
    border-right: none;
  }
  .affine-database-column-drag-handle {
    position: absolute;
    z-index: 1;
    top: 0;
    left: -8px;
    width: 16px;
    height: 100%;
    cursor: col-resize;
  }
  .affine-database-column-drag-handle::before {
    content: ' ';
    display: none;
    position: absolute;
    width: 2px;
    height: 100%;
    left: 7px;
    background: #5438ff;
    box-shadow: 0px 0px 8px rgba(84, 56, 255, 0.35);
  }
  .affine-database-column-drag-handle:hover::before,
  .affine-database-column-drag-handle.dragging::before {
    display: block;
  }
  .affine-database-column-content:hover {
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.04)),
      #ffffff;
  }
  .affine-database-column-content.edit {
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.08)),
      #ffffff;
  }
  .affine-database-column-text {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--affine-secondary-text-color);
    font-size: 14px;
    font-weight: 600;
  }
  .affine-database-column-text svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
  }
  .affine-database-column-text.select svg {
    fill: none;
  }
  .affine-database-column-text-input {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .affine-database-column-input {
    width: 100%;
    height: 24px;
    padding: 0;
    border: none;
    color: inherit;
    font-weight: 600;
    font-size: 14px;
    font-family: var(--affine-font-family);
    background: transparent;
  }
  .affine-database-column-input:focus {
    outline: none;
  }
  .affine-database-column-drag {
    display: flex;
    align-items: center;
    visibility: hidden;
  }
  .affine-database-column-drag svg {
    width: 10px;
    height: 14px;
  }
  .affine-database-column-content:hover .affine-database-column-drag {
    visibility: visible;
  }

  .affine-database-add-column-button {
    visibility: hidden;
    position: fixed;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 38px;
    cursor: pointer;
  }
  .header-add-column-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
`;

@customElement('affine-database-column-header')
export class DatabaseColumnHeader extends ShadowlessElement {
  static styles = styles;

  @property()
  targetModel!: DatabaseBlockModel;

  @property()
  columns!: Column[];

  @property()
  addColumn!: (index: number) => string;

  @property()
  setChangingColumnWidth!: (config: ColumnWidthConfig) => void;

  @property()
  tableContainer!: HTMLElement;

  @state()
  private _editingColumnId = '';

  @query('.affine-database-column-input')
  private _titleColumnInput!: HTMLInputElement;

  @query('.affine-database-column-header')
  private _headerContainer!: HTMLElement;

  @query('.affine-database-add-column-button')
  private _addColumnButton!: HTMLElement;

  @query('.header-add-column-button')
  private _headerAddColumnButton!: HTMLElement;

  @state()
  private _widthChangingIndex = -1;

  private _disposables: DisposableGroup = new DisposableGroup();
  private _changeColumnWidthDisposable: DisposableGroup = new DisposableGroup();
  private _changeColumnWidthConfig: ColumnWidthConfig | null = null;
  private _isHeaderHover = false;

  setEditingColumnId = (id: string) => {
    this._editingColumnId = id;
  };

  firstUpdated() {
    this._initChangeColumnWidthEvent();
    this.setDragHandleHeight();

    const databaseElement = this.closest('affine-database');
    assertExists(databaseElement);
    this._initResizeEffect(databaseElement);
    this._initHeaderMousemoveEvent();
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('_editingColumnId') && !!this._editingColumnId) {
      this._titleColumnInput.focus();
      const length = this._titleColumnInput.value.length;
      this._titleColumnInput.setSelectionRange(0, length);
      onClickOutside(
        this._titleColumnInput,
        () => {
          this.setEditingColumnId('');
        },
        'mousedown'
      );
    }

    if (changedProperties.has('columns')) {
      // bind event when new column is added
      this._initChangeColumnWidthEvent();
      this.setDragHandleHeight();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
    this._changeColumnWidthDisposable.dispose();
  }

  private _initResizeEffect(element: HTMLElement) {
    const pageBlock = getDefaultPage(this.targetModel.page);
    const viewportElement = pageBlock?.viewportElement;
    assertExists(viewportElement);

    const resizeObserver = new ResizeObserver(
      (entries: ResizeObserverEntry[]) => {
        for (const { target } of entries) {
          if (target === viewportElement) {
            const { right: containerRight } = element.getBoundingClientRect();
            // calc the position of add column button
            this._addColumnButton.style.left = `${containerRight}px`;
            break;
          }
        }
      }
    );
    resizeObserver.observe(viewportElement);
  }

  setDragHandleHeight() {
    const db = this.closest('affine-database');
    const databaseBody = db?.querySelector('.affine-database-block-rows');
    assertExists(databaseBody);
    const dragHandleHeight =
      databaseBody.clientHeight + DEFAULT_COLUMN_TITLE_HEIGHT - 1;
    const allDragHandle = db?.querySelectorAll<HTMLElement>(
      '.affine-database-column-drag-handle'
    );
    allDragHandle?.forEach(handle => {
      handle.style.height = `${dragHandleHeight}px`;
    });
  }

  private _initHeaderMousemoveEvent() {
    this._disposables.addFromEvent(
      this._headerContainer,
      'mouseover',
      event => {
        this._isHeaderHover = true;
        this.showAddColumnButton(event);
      }
    );
    this._disposables.addFromEvent(
      this._headerContainer,
      'mouseleave',
      event => {
        this._isHeaderHover = false;
        this.showAddColumnButton(event);
      }
    );
  }
  showAddColumnButton = (event?: MouseEvent) => {
    const databaseElement = this.closest('affine-database');
    assertExists(databaseElement);
    const { right: boundaryRight } = databaseElement.getBoundingClientRect();
    const { left: headerAddColumnButtonLeft } =
      this._headerAddColumnButton.getBoundingClientRect();

    let isInHeader = true;
    if (event) {
      // mouse over the header
      isInHeader =
        event.offsetY <= DEFAULT_COLUMN_TITLE_HEIGHT && event.offsetY >= 0;
    }

    const needShow = boundaryRight <= headerAddColumnButtonLeft;
    if (needShow && this._isHeaderHover && isInHeader) {
      this._addColumnButton.style.visibility = 'visible';
    } else {
      this._addColumnButton.style.visibility = 'hidden';
    }
  };

  private _initChangeColumnWidthEvent() {
    this._changeColumnWidthDisposable.dispose();

    const columns = this._headerContainer.querySelectorAll<HTMLDivElement>(
      '.affine-database-column'
    );
    columns.forEach((column, index) => {
      this._changeColumnWidthDisposable.addFromEvent(
        column,
        'mousedown',
        (event: MouseEvent) => this._onColumnWidthMousedown(event, index)
      );
    });

    this._changeColumnWidthDisposable.addFromEvent(
      document,
      'mousemove',
      this._onColumnWidthMousemove
    );
    this._changeColumnWidthDisposable.addFromEvent(
      document,
      'mouseup',
      this._onColumnWidthMouseup
    );
  }
  private _onColumnWidthMousedown = (event: MouseEvent, index: number) => {
    // all rows cell in current column
    const currentColumnCells = Array.from(
      this.tableContainer.querySelectorAll<HTMLElement>(
        `.database-cell:nth-child(${index})`
      )
    );

    const dragHandleCell = this._headerContainer.querySelector<HTMLElement>(
      `.database-cell:nth-child(${index + 1})`
    );
    assertExists(dragHandleCell);

    const parentElement = this.tableContainer.parentElement;
    assertExists(parentElement);
    this._changeColumnWidthConfig = {
      index: index - 1,
      rowCells: currentColumnCells,
      scrollLeft: parentElement.scrollLeft,
      lastClientX: event.clientX,
      startClientX: event.clientX,
      rawWidth: currentColumnCells[0].clientWidth,
      currentCell: dragHandleCell,
      rafId: undefined,
    };
  };

  private _onColumnWidthMousemove = (event: MouseEvent) => {
    event.preventDefault();
    if (!this._changeColumnWidthConfig) return;

    const {
      rafId,
      index,
      rowCells,
      rawWidth,
      lastClientX,
      startClientX,
      scrollLeft: startScrollLeft,
    } = this._changeColumnWidthConfig;

    if (this._widthChangingIndex !== index) this._widthChangingIndex = index;
    if (event.clientX - lastClientX === 0) return;

    const direction = event.clientX - lastClientX > 0 ? 'right' : 'left';
    this._changeColumnWidthConfig.lastClientX = event.clientX;

    const onUpdateDOM = () => {
      const columnWidth =
        rawWidth + event.clientX - startClientX <= DEFAULT_COLUMN_MIN_WIDTH
          ? DEFAULT_COLUMN_MIN_WIDTH
          : rawWidth + event.clientX - startClientX;

      // update column width
      rowCells.forEach(cell => {
        cell.style.width = `${columnWidth}px`;
        const titleText = cell.querySelector<HTMLDivElement>(
          '.affine-database-column-text-input'
        );
        if (titleText) {
          // 54px is the width of other elements of the column
          titleText.style.width = `${columnWidth - 54}px`;
        }
      });

      // scroll when crossing the right border
      const parentElement = this.tableContainer.parentElement;
      assertExists(parentElement);
      const { right: boundaryRight, left: boundaryLeft } =
        parentElement.getBoundingClientRect();
      // the distance from the drag handle to the right border
      const dragHandleRight =
        event.clientX - boundaryRight + DEFAULT_ADD_BUTTON_WIDTH;
      // →
      if (dragHandleRight >= 0) {
        // → | →
        // the `|` is boundary
        if (direction === 'right') {
          // 1. Drag right 100 (scroll distance 100)
          // 2. Drag left 30 (scroll distance unchanged)
          // 3. At this point, dragging further to the right should keep the 100
          parentElement.scrollLeft = Math.max(
            parentElement.scrollLeft,
            startScrollLeft + dragHandleRight
          );
        } else {
          // → | ←
          let scrollLeft = parentElement.scrollLeft;
          if (dragHandleRight <= DEFAULT_ADD_BUTTON_WIDTH) {
            scrollLeft += dragHandleRight;
          }
          parentElement.scrollLeft = Math.min(
            scrollLeft,
            startScrollLeft + dragHandleRight
          );
        }
        return;
      }

      // scroll when crossing the left border
      const dragHandleLeft =
        event.clientX - boundaryLeft - DEFAULT_ADD_BUTTON_WIDTH;
      // ← | ←
      if (dragHandleLeft <= 0 && parentElement.scrollLeft > 0) {
        parentElement.scrollLeft = startScrollLeft + dragHandleLeft;
      }
    };
    if (rafId) cancelAnimationFrame(rafId);
    this._changeColumnWidthConfig.rafId = requestAnimationFrame(onUpdateDOM);
  };
  private _onColumnWidthMouseup = (event: MouseEvent) => {
    this._widthChangingIndex = -1;
    if (!this._changeColumnWidthConfig) return;
    const { rafId, index, rowCells } = this._changeColumnWidthConfig;
    if (rafId) cancelAnimationFrame(rafId);
    this._changeColumnWidthConfig = null;

    const columnWidth = rowCells[0].offsetWidth;
    this.targetModel.page.captureSync();
    if (index === 0) {
      this.targetModel.page.updateBlock(this.targetModel, {
        titleColumnWidth: columnWidth,
      });
    } else {
      const columnId = this.targetModel.columns[index - 1];
      const columnProps = this.targetModel.page.db.getColumn(columnId);
      this.targetModel.page.db.updateColumn({
        ...columnProps,
        width: columnWidth,
      });
    }
  };

  private _onShowEditColumnPopup = (
    target: Element,
    column: Column | string,
    index: number
  ) => {
    if (this._editingColumnId) return;

    const currentEl = target as Element;
    const reference = currentEl.classList.contains('affine-database-column')
      ? target
      : target.parentElement;
    assertExists(reference);

    const editColumn = new EditColumnPopup();
    editColumn.setTitleColumnEditId = this.setEditingColumnId;
    editColumn.targetModel = this.targetModel;
    editColumn.targetColumn = column;
    editColumn.columnIndex = index - 1;
    editColumn.closePopup = () => {
      editColumn.remove();
    };
    editColumn.insertColumn = position => {
      const insertIdex =
        position === ColumnInsertPosition.Right ? index : index - 1;
      this.addColumn(insertIdex);
    };
    document.body.appendChild(editColumn);
    requestAnimationFrame(() => {
      createPopper(reference, editColumn, { placement: 'bottom-start' });
      onClickOutside(editColumn, ele => ele.remove(), 'mousedown');
    });
  };

  private _onKeydown = (
    event: KeyboardEvent,
    type: 'title' | 'normal',
    column?: Column
  ) => {
    const name = (event.target as HTMLInputElement).value;
    if (event.key === 'Enter') {
      this.targetModel.page.captureSync();
      if (type === 'title') {
        // title column
        this._onUpdateTitleColumn(name);
      } else {
        // other columns
        assertExists(column);
        this._onUpdateNormalColumn(name, column);
      }
      this.setEditingColumnId('');
      return;
    }
    if (event.key === 'Escape') {
      this.setEditingColumnId('');
      return;
    }
  };

  private _onUpdateTitleColumn = (titleColumnName: string) => {
    this.targetModel.page.updateBlock(this.targetModel, {
      titleColumnName,
    });
  };

  private _onUpdateNormalColumn = (name: string, column: Column) => {
    this.targetModel.page.db.updateColumn({
      ...column,
      name,
    });
    this.targetModel.propsUpdated.emit();
  };

  render() {
    const style = styleMap({
      width: `${this.targetModel.titleColumnWidth}px`,
    });

    return html`
      <div class="affine-database-column-header database-row">
        <div class="affine-database-column database-cell" style=${style}>
          <div
            class="affine-database-column-content ${this._editingColumnId ===
            '-1'
              ? 'edit'
              : ''}"
            data-column-id="-1"
            @click=${(event: MouseEvent) =>
              this._onShowEditColumnPopup(
                event.target as Element,
                this.targetModel.titleColumnName,
                0
              )}
          >
            <div class="affine-database-column-text">
              ${TextIcon}
              <div class="affine-database-column-text-input">
                ${this._editingColumnId === '-1'
                  ? html`<input
                      class="affine-database-column-input"
                      value=${this.targetModel.titleColumnName}
                      @keydown=${(event: KeyboardEvent) =>
                        this._onKeydown(event, 'title')}
                    />`
                  : this.targetModel.titleColumnName}
              </div>
            </div>
            <!-- TODO: change icon -->
            <div class="affine-database-column-drag">${TextIcon}</div>
          </div>
        </div>
        ${repeat(
          this.columns,
          column => column.id,
          (column, index) => {
            const style = styleMap({
              width: `${column.width}px`,
            });
            return html`
              <div class="affine-database-column database-cell" style=${style}>
                <div
                  class="affine-database-column-content ${this
                    ._editingColumnId === column.id
                    ? 'edit'
                    : ''}"
                  data-column-id="${column.id}"
                  @click=${(event: MouseEvent) =>
                    this._onShowEditColumnPopup(
                      event.target as Element,
                      column,
                      index + 1
                    )}
                >
                  <div class="affine-database-column-text ${column.type}">
                    ${columnTypeIconMap[column.type]}
                    <div class="affine-database-column-text-input">
                      ${this._editingColumnId === column.id
                        ? html`<input
                            class="affine-database-column-input"
                            value=${column.name}
                            @keydown=${(event: KeyboardEvent) =>
                              this._onKeydown(event, 'normal', column)}
                          />`
                        : column.name}
                    </div>
                  </div>
                  <!-- TODO: change icon -->
                  <div class="affine-database-column-drag">${TextIcon}</div>
                </div>
                <div
                  class="affine-database-column-drag-handle ${this
                    ._widthChangingIndex === index
                    ? 'dragging'
                    : ''}"
                ></div>
              </div>
            `;
          }
        )}
        <div class="affine-database-column database-cell add-column-button">
          <div
            class="affine-database-column-drag-handle  ${this
              ._widthChangingIndex === this.columns.length
              ? 'dragging'
              : ''}"
          ></div>
          <div
            class="header-add-column-button"
            @click=${() => this.addColumn(this.targetModel.columns.length)}
          >
            ${DatabaseAddColumn}
          </div>
        </div>
        <div
          class="affine-database-add-column-button"
          data-test-id="affine-database-add-column-button"
          @click=${() => this.addColumn(this.targetModel.columns.length)}
        >
          ${DatabaseAddColumn}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-header': DatabaseColumnHeader;
  }
}
