import {
  DatabaseAddColumn,
  DatabaseDragIcon,
  DatabaseMultiSelect,
  DatabaseNumber,
  DatabaseProgress,
  DatabaseSelect,
  PenIcon,
  TextIcon,
} from '@blocksuite/global/config';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import { createPopper } from '@popperjs/core';
import { type TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { getDefaultPage } from '../../../__internal__/index.js';
import {
  ShadowlessElement,
  WithDisposable,
} from '../../../__internal__/utils/lit.js';
import { DEFAULT_COLUMN_TITLE_HEIGHT } from '../../consts.js';
import type { DatabaseBlockModel } from '../../database-model.js';
import type { ColumnRendererHelper } from '../../register.js';
import type { Column } from '../../types.js';
import { ColumnInsertPosition } from '../../types.js';
import { onClickOutside } from '../../utils.js';
import { ColumnTypePopup } from '../edit-column-popup/column-type-popup.js';
import { EditColumnPopup } from '../edit-column-popup/edit-column-popup.js';
import { changeColumnType } from '../edit-column-popup/utils.js';
import type { ColumnDragIndicator } from './column-move/column-drag-indicator.js';
import { initMoveColumnHandlers } from './column-move/index.js';
import { initChangeColumnWidthHandlers } from './column-width/index.js';
import { styles } from './styles.js';

const columnTypeIconMap: Record<string, TemplateResult> = {
  select: DatabaseSelect,
  number: DatabaseNumber,
  progress: DatabaseProgress,
  'rich-text': TextIcon,
  'multi-select': DatabaseMultiSelect,
};

@customElement('affine-database-column-header')
export class DatabaseColumnHeader extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property()
  targetModel!: DatabaseBlockModel;

  @property()
  columns!: Column[];

  @property()
  addColumn!: (index: number) => string;

  @property()
  columnRenderer!: ColumnRendererHelper;

  get tableContainer(): HTMLElement {
    return this.parentElement as HTMLElement;
  }

  @state()
  private _editingColumnId = '';

  @state()
  private _changingColumnTypeId = '';

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

  private _columnWidthDisposables: DisposableGroup = new DisposableGroup();
  private _columnMoveDisposables: DisposableGroup = new DisposableGroup();
  private _isHeaderHover = false;
  private _indicator: ColumnDragIndicator | null = null;
  private _editingColumnPopupIndex = -1;
  private _columnTypePopup: ColumnTypePopup | null = null;

  private get readonly() {
    return this.targetModel.page.readonly;
  }

  setEditingColumnId = (id: string) => {
    this._editingColumnId = id;
  };

  override firstUpdated() {
    if (this.readonly) return;

    this._initChangeColumnWidthHandlers();
    this._initHeaderMousemoveHandlers();
    this._initMoveColumnHandlers();
    this.setDragHandleHeight();

    const databaseElement = this.closest('affine-database');
    if (databaseElement) {
      this._initResizeEffect(databaseElement);
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (this.readonly) return;

    if (changedProperties.has('_editingColumnId') && !!this._editingColumnId) {
      this._titleColumnInput.focus();
      const length = this._titleColumnInput.value.length;
      this._titleColumnInput.setSelectionRange(0, length);
    }

    if (changedProperties.has('columns')) {
      // bind event when new column is added
      this._initMoveColumnHandlers();
      this._initChangeColumnWidthHandlers();
      this.setDragHandleHeight();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._columnWidthDisposables.dispose();

    if (this._indicator) {
      this._indicator.targetRect = null;
    }
  }

  private _initResizeEffect(element: HTMLElement) {
    const pageBlock = getDefaultPage(this.targetModel.page);
    const viewportElement = pageBlock?.viewportElement;
    if (viewportElement) {
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
  }

  setDragHandleHeight() {
    const databaseElement = this.closest('affine-database');
    // When dragging to generate a database preview,
    // the database may not be rendered to the page in time
    if (!databaseElement) return;
    const databaseBody = databaseElement.querySelector(
      'affine-database-row-container'
    );
    assertExists(databaseBody);
    const dragHandleHeight =
      databaseBody.clientHeight + DEFAULT_COLUMN_TITLE_HEIGHT - 1;
    const allDragHandle = databaseElement.querySelectorAll<HTMLElement>(
      '.affine-database-column-drag-handle'
    );
    allDragHandle.forEach(handle => {
      handle.style.height = `${dragHandleHeight}px`;
    });
  }

  private _initHeaderMousemoveHandlers() {
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

  private _setChangingColumnIndex = (index: number) => {
    if (this._widthChangingIndex !== index) {
      this._widthChangingIndex = index;
    }
  };

  private _initChangeColumnWidthHandlers() {
    // Don't `dispose()` if column width is being changed
    const isChangingWidth = this._widthChangingIndex !== -1;
    if (isChangingWidth) return;

    this._columnWidthDisposables.dispose();
    const disposables = initChangeColumnWidthHandlers(
      this._headerContainer,
      this.tableContainer,
      this.targetModel,
      this._setChangingColumnIndex
    );
    this._columnWidthDisposables = disposables;
  }

  private _initMoveColumnHandlers() {
    // remove previous handlers
    this._columnMoveDisposables.dispose();

    const disposables = initMoveColumnHandlers(
      this._headerContainer,
      this.tableContainer,
      this.targetModel
    );
    // bind new handlers
    this._columnMoveDisposables = disposables;
  }

  private _onShowEditColumnPopup = (
    target: Element,
    column: Column | string,
    index: number
  ) => {
    if (this._editingColumnId || this.readonly) return;
    if (this._editingColumnPopupIndex === index) {
      this._editingColumnPopupIndex = -1;
      return;
    }
    this._editingColumnPopupIndex = index;

    const currentEl = target as Element;
    const reference = currentEl.closest('.affine-database-column');
    assertExists(reference);

    const editColumn = new EditColumnPopup();
    editColumn.setTitleColumnEditId = this.setEditingColumnId;
    editColumn.targetModel = this.targetModel;
    editColumn.targetColumn = column;
    editColumn.columnIndex = index - 1;
    editColumn.columnRenderer = this.columnRenderer;
    editColumn.closePopup = () => {
      this._editingColumnPopupIndex = -1;
      editColumn.remove();
    };
    editColumn.insertColumn = position => {
      const insertIdex =
        position === ColumnInsertPosition.Right ? index : index - 1;
      this.addColumn(insertIdex);
    };
    document.body.appendChild(editColumn);
    createPopper(reference, editColumn, { placement: 'bottom-start' });
    onClickOutside(
      editColumn,
      (ele, target) => {
        // click outside of column title, need to reset the index
        if (!target.closest('.affine-database-column-content')) {
          this._editingColumnPopupIndex = -1;
        }
        ele.remove();
      },
      'mousedown'
    );
  };

  private _onShowColumnTypePopup = (
    event: MouseEvent,
    columnId: string,
    column: Column
  ) => {
    event.stopPropagation();
    if (this._columnTypePopup || this.readonly) return;

    this._changingColumnTypeId = columnId;
    const popup = new ColumnTypePopup();
    popup.columnId = columnId;
    popup.columnType = column.type;
    popup.changeColumnType = (columnId, type) => {
      changeColumnType(
        columnId,
        type,
        column,
        this.targetModel,
        this.columnRenderer
      );
      this._changingColumnTypeId = '';
      this._columnTypePopup = null;
      popup.remove();
      onRemoveListener();
    };
    this._columnTypePopup = popup;
    document.body.appendChild(this._columnTypePopup);

    const target = event.target as HTMLElement;
    const reference = target.closest('.affine-database-column-content');
    assertExists(reference);

    createPopper(reference, this._columnTypePopup, {
      placement: 'bottom-start',
    });
    const onRemoveListener = onClickOutside(
      popup,
      (ele, target) => {
        if (!target.closest('.affine-database-column-content')) {
          this._changingColumnTypeId = '';
          this._columnTypePopup = null;
          ele.remove();
          onRemoveListener();
        }
      },
      'mousedown',
      true
    );
  };

  private _onKeydown = (
    event: KeyboardEvent,
    type: 'title' | 'normal',
    column?: Column
  ) => {
    if (event.key === 'Enter') {
      this.targetModel.page.captureSync();
      this._saveColumnTitle(type, column);
      return;
    }
    if (event.key === 'Escape') {
      this.setEditingColumnId('');
      return;
    }
  };

  private _saveColumnTitle = (type: 'title' | 'normal', column?: Column) => {
    // Prevent triggering again after press enter key
    if (this._editingColumnId === '') return;

    const name = this._titleColumnInput.value;
    if (type === 'title') {
      // title column
      this._onUpdateTitleColumn(name);
    } else {
      // other columns
      assertExists(column);
      this._onUpdateNormalColumn(name, column);
    }
    // To handle this situation:
    // 1. click the pen icon, edit the title
    // 2. then click the other column's pen icon, edit the title
    if (this._editingColumnId === column?.id) {
      this.setEditingColumnId('');
    }
  };

  private _onUpdateTitleColumn = (titleColumnName: string) => {
    this.targetModel.page.updateBlock(this.targetModel, {
      titleColumnName,
    });
  };

  private _onUpdateNormalColumn = (name: string, column: Column) => {
    this.targetModel.page.captureSync();
    this.targetModel.updateColumn({
      ...column,
      name,
    });
    this.targetModel.applyColumnUpdate();
  };

  private _onEditColumnTitle = (event: MouseEvent, columnId: string) => {
    event.stopPropagation();
    this.setEditingColumnId(columnId);
  };

  private _onAddColumn = () => {
    if (this.readonly) return;
    this.addColumn(this.targetModel.columns.length);
  };

  override render() {
    const style = styleMap({
      width: `${this.targetModel.titleColumnWidth}px`,
    });

    const isEditing = this._editingColumnId === '-1' && !this.readonly;
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
              <div class="affine-database-column-type-icon">${TextIcon}</div>
              ${isEditing
                ? html`<input
                    class="affine-database-column-input"
                    value=${this.targetModel.titleColumnName}
                    @keydown=${(event: KeyboardEvent) =>
                      this._onKeydown(event, 'title')}
                    @blur=${() => this._saveColumnTitle('title')}
                  />`
                : html`<div class="affine-database-column-text-content">
                    <div class="affine-database-column-text-input">
                      ${this.targetModel.titleColumnName}
                    </div>
                    ${this.readonly
                      ? null
                      : html`<div
                          class="affine-database-column-text-icon"
                          @click=${(e: MouseEvent) =>
                            this._onEditColumnTitle(e, '-1')}
                        >
                          ${PenIcon}
                        </div>`}
                  </div>`}
            </div>
          </div>
        </div>
        ${repeat(
          this.columns,
          column => column.id,
          (column, index) => {
            const style = styleMap({
              width: `${column.width}px`,
            });
            const isEditing =
              this._editingColumnId === column.id && !this.readonly;
            const isChangingColumnType =
              this._changingColumnTypeId === column.id;

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
                    <div
                      class="affine-database-column-type-icon ${isEditing
                        ? 'edit'
                        : ''} ${isChangingColumnType ? 'active' : ''}"
                      @click=${(e: MouseEvent) =>
                        this._onShowColumnTypePopup(e, column.id, column)}
                    >
                      ${columnTypeIconMap[column.type]}
                    </div>
                    ${isEditing
                      ? html`<input
                          class="affine-database-column-input"
                          value=${column.name}
                          @keydown=${(event: KeyboardEvent) =>
                            this._onKeydown(event, 'normal', column)}
                          @blur=${() => this._saveColumnTitle('normal', column)}
                        />`
                      : html`<div class="affine-database-column-text-content">
                          <div class="affine-database-column-text-input">
                            ${column.name}
                          </div>
                          ${this.readonly
                            ? null
                            : html`<div
                                class="affine-database-column-text-icon"
                                @click=${(e: MouseEvent) =>
                                  this._onEditColumnTitle(e, column.id)}
                              >
                                ${PenIcon}
                              </div>`}
                        </div>`}
                  </div>
                  ${this.readonly
                    ? null
                    : html`<div
                        draggable="true"
                        class="affine-database-column-move"
                      >
                        ${DatabaseDragIcon}
                      </div>`}
                </div>
                ${this.readonly
                  ? null
                  : html`<div
                      class="affine-database-column-drag-handle ${this
                        ._widthChangingIndex === index
                        ? 'dragging'
                        : ''}"
                    ></div>`}
              </div>
            `;
          }
        )}
        <div class="affine-database-column database-cell add-column-button">
          ${this.readonly
            ? null
            : html`<div
                  class="affine-database-column-drag-handle  ${this
                    ._widthChangingIndex === this.columns.length
                    ? 'dragging'
                    : ''}"
                ></div>
                <div
                  class="header-add-column-button"
                  @click=${this._onAddColumn}
                >
                  ${DatabaseAddColumn}
                </div>`}
        </div>
        ${this.readonly
          ? null
          : html`<div
              class="affine-database-add-column-button"
              data-test-id="affine-database-add-column-button"
              @click=${this._onAddColumn}
            >
              ${DatabaseAddColumn}
            </div>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-header': DatabaseColumnHeader;
  }
}
