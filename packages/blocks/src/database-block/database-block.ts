// related component
import './components/add-column-type-popup.js';
import './components/cell-container.js';

import {
  DatabaseMultiSelect,
  DatabaseNumber,
  DatabaseProgress,
  DatabaseSearchIcon,
  DatabaseSelect,
  MoreHorizontalIcon,
  PlusIcon,
  TextIcon,
} from '@blocksuite/global/config';
import {
  ColumnInsertPosition,
  type ColumnSchema,
} from '@blocksuite/global/database';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import { VEditor } from '@blocksuite/virgo';
import { createPopper } from '@popperjs/core';
import { css, type TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { type BlockHost } from '../__internal__/index.js';
import { BlockElementWithService } from '../__internal__/service/components.js';
import { NonShadowLitElement } from '../__internal__/utils/lit.js';
import { setupVirgoScroll } from '../__internal__/utils/virgo.js';
import { registerInternalRenderer } from './components/column-type/index.js';
import { EditColumnPopup } from './components/edit-column-popup.js';
import type { DatabaseBlockModel } from './database-model.js';
import { getColumnSchemaRenderer } from './register.js';
import { onClickOutside } from './utils.js';

type ColumnValues = string[];

/**
 * Containing all the rows and column values inside the database block.
 * ```
 * { rowId: ColumnValues }
 * ```
 */
type DatabaseMap = Record<string, ColumnValues>;

const enum SearchState {
  /** show search input */
  SearchInput = 'input',
  /** show search icon */
  SearchIcon = 'icon',
  /** searching */
  Searching = 'searching',
}

const FIRST_LINE_TEXT_WIDTH = 200;
const ADD_COLUMN_BUTTON_WIDTH = 40;

const columnTypeIconMap: Record<string, TemplateResult> = {
  select: DatabaseSelect,
  number: DatabaseNumber,
  progress: DatabaseProgress,
  'rich-text': TextIcon,
  'multi-select': DatabaseMultiSelect,
};

let once = true;
if (once) {
  registerInternalRenderer();
  once = false;
}

@customElement('affine-database-column-header')
class DatabaseColumnHeader extends NonShadowLitElement {
  static styles = css`
    :host * {
      box-sizing: border-box;
    }
    .affine-database-column-header {
      display: flex;
      flex-direction: row;
      height: 44px;
    }

    .affine-database-column {
      display: flex;
      align-items: center;
      width: 145px;
      padding: 8px;
      border-right: 1px solid var(--affine-border-color);
    }
    .affine-database-column:hover {
      background: linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.04),
          rgba(0, 0, 0, 0.04)
        ),
        #ffffff;
    }
    .affine-database-column.edit {
      background: linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.08),
          rgba(0, 0, 0, 0.08)
        ),
        #ffffff;
    }
    .affine-database-column-text {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 4px;
      max-width: 173px;
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
    .affine-database-column:hover .affine-database-column-drag {
      visibility: visible;
    }
  `;

  @property()
  targetModel!: DatabaseBlockModel;

  @property()
  columns!: ColumnSchema[];

  @property()
  addColumn!: (index: number) => string;

  @state()
  private _editingColumnId = '';

  @query('.affine-database-column-input')
  private _titleColumnInput!: HTMLInputElement;

  setEditingColumnId = (id: string) => {
    this._editingColumnId = id;
  };

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
  }

  private _onShowEditColumnPopup = (
    target: Element,
    column: ColumnSchema | string,
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
    editColumn.targetColumnSchema = column;
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
    column?: ColumnSchema
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

  private _onUpdateTitleColumn = (name: string) => {
    this.targetModel.page.updateBlock(this.targetModel, {
      titleColumn: name,
    });
  };

  private _onUpdateNormalColumn = (name: string, column: ColumnSchema) => {
    this.targetModel.page.db.updateColumnSchema({
      ...column,
      name,
    });
    this.targetModel.propsUpdated.emit();
  };

  render() {
    return html`
      <div class="affine-database-column-header">
        <div
          class="affine-database-column ${this._editingColumnId === '-1'
            ? 'edit'
            : ''}"
          data-column-id="-1"
          style=${styleMap({
            minWidth: `${FIRST_LINE_TEXT_WIDTH}px`,
            maxWidth: `${FIRST_LINE_TEXT_WIDTH}px`,
          })}
          @click=${(event: MouseEvent) =>
            this._onShowEditColumnPopup(
              event.target as Element,
              this.targetModel.titleColumn,
              0
            )}
        >
          <div class="affine-database-column-text">
            ${TextIcon}
            <div class="affine-database-column-text-input">
              ${this._editingColumnId === '-1'
                ? html`<input
                    class="affine-database-column-input"
                    value=${this.targetModel.titleColumn}
                    @keydown=${(event: KeyboardEvent) =>
                      this._onKeydown(event, 'title')}
                  />`
                : this.targetModel.titleColumn}
            </div>
          </div>
          <!-- TODO: change icon -->
          <div class="affine-database-column-drag">${TextIcon}</div>
        </div>
        ${repeat(
          this.columns,
          column => column.id,
          (column, index) => {
            return html`
              <div
                class="affine-database-column  ${this._editingColumnId ===
                column.id
                  ? 'edit'
                  : ''}"
                data-column-id="${column.id}"
                style=${styleMap({
                  minWidth: `${column.width}px`,
                  maxWidth: `${column.width}px`,
                })}
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
            `;
          }
        )}
      </div>
    `;
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-header': DatabaseColumnHeader;
  }
}

function DataBaseRowContainer(
  databaseBlock: DatabaseBlockComponent,
  filteredRowIds: string[],
  searchState: SearchState
) {
  const databaseModel = databaseBlock.model;

  const filteredChildren =
    searchState === SearchState.Searching
      ? databaseModel.children.filter(
          child => filteredRowIds.indexOf(child.id) > -1
        )
      : databaseModel.children;

  return html`
    <style>
      .affine-database-block-rows {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
      }

      .affine-database-block-row {
        width: 100%;
        min-height: 44px;
        display: flex;
        flex-direction: row;
        border-bottom: 1px solid var(--affine-border-color);
      }
      .affine-database-block-row:nth-of-type(1) {
        border-top: 1px solid var(--affine-border-color);
      }

      .affine-database-block-row-cell {
        display: flex;
        align-items: center;
        width: 145px;
        min-height: 44px;
        padding: 0 8px;
        border-right: 1px solid var(--affine-border-color);
      }
      .affine-database-block-row-cell > affine-paragraph > .text {
        margin-top: unset;
      }
    </style>
    <div class="affine-database-block-rows">
      ${repeat(
        filteredChildren,
        child => child.id,
        (child, idx) => {
          return html`
            <div class="affine-database-block-row" data-row-id="${idx}">
              <div
                class="affine-database-block-row-cell"
                style=${styleMap({
                  minWidth: `${FIRST_LINE_TEXT_WIDTH}px`,
                  maxWidth: `${FIRST_LINE_TEXT_WIDTH}px`,
                })}
              >
                ${BlockElementWithService(child, databaseBlock, () => {
                  databaseBlock.requestUpdate();
                })}
              </div>
              ${repeat(databaseBlock.columns, column => {
                return html`
                  <affine-database-cell-container
                    .databaseModel=${databaseModel}
                    .rowModel=${child}
                    .columnSchema=${column}
                  >
                  </affine-database-cell-container>
                `;
              })}
            </div>
          `;
        }
      )}
    </div>
  `;
}

@customElement('affine-database')
export class DatabaseBlockComponent
  extends NonShadowLitElement
  implements BlockHost<undefined>
{
  flavour = 'affine:database' as const;
  slots: undefined;
  get page() {
    return this.host.page;
  }
  get clipboard() {
    return this.host.clipboard;
  }
  get getService() {
    return this.host.getService;
  }

  static styles = css`
    affine-database {
      position: relative;
    }

    .affine-database-block-title-container {
      display: flex;
      align-items: center;
      height: 44px;
      margin: 12px 0px;
    }

    .affine-database-block-title {
      flex: 1;
      position: sticky;
      width: 300px;
      height: 30px;
      font-size: 18px;
      font-weight: 600;
      line-height: 24px;
      color: #424149;
      font-family: inherit;
      overflow: hidden;
      cursor: text;
    }

    .affine-database-block-title [data-virgo-text='true'] {
      display: inline-block;
      width: 300px;
      max-width: 300px;
      white-space: nowrap !important;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .affine-database-block-title:focus {
      outline: none;
    }

    .affine-database-block-title:disabled {
      background-color: transparent;
    }

    .affine-database-block-title-empty::before {
      content: 'Database';
      color: var(--affine-placeholder-color);
      position: absolute;
      opacity: 0.5;
    }

    .affine-database-toolbar {
      display: flex;
      align-items: center;
      gap: 26px;
    }
    .affine-database-toolbar-search svg,
    .affine-database-toolbar svg {
      width: 16px;
      height: 16px;
    }
    .affine-database-toolbar-item {
      display: flex;
      align-items: center;
    }
    .affine-database-toolbar-item.search {
      overflow: hidden;
    }
    .affine-database-search-container {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 138px;
      height: 32px;
      padding: 8px 12px;
      border-radius: 8px;
      background-color: rgba(0, 0, 0, 0);
      transform: translate(110px, 0px);
      transition: all 0.3s ease;
    }
    .affine-database-search-container > svg {
      min-width: 16px;
      min-height: 16px;
    }
    .search-container-expand {
      transform: translate(0px, 0px);
      background-color: rgba(0, 0, 0, 0.04);
    }
    .search-input-container {
      display: flex;
      align-items: center;
    }
    .affine-database-search-input-icon {
      display: inline-flex;
    }
    .affine-database-search-input {
      flex: 1;
      height: 16px;
      width: 80px;
      border: none;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-sm);
      box-sizing: border-box;
      color: inherit;
      background: transparent;
    }
    .affine-database-search-input:focus {
      outline: none;
    }
    .affine-database-search-input::placeholder {
      color: #888a9e;
      font-size: var(--affine-font-sm);
    }

    .affine-database-toolbar-item.new-record {
      display: flex;
      align-items: center;
      gap: 4px;
      width: 120px;
      height: 32px;
      padding: 6px 8px;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05),
        0px 0px 0px 0.5px rgba(0, 0, 0, 0.1);
      background: linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.04),
          rgba(0, 0, 0, 0.04)
        ),
        #ffffff;
    }

    .affine-database-block-table {
      position: relative;
      width: 100%;
      overflow-x: scroll;
      border-top: 1.5px solid var(--affine-border-color);
    }

    .affine-database-block-tag-circle {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }

    .affine-database-block-tag {
      display: inline-flex;
      border-radius: 11px;
      align-items: center;
      padding: 0 8px;
      cursor: pointer;
    }

    .affine-database-block-footer {
      display: flex;
      width: 100%;
      height: 42px;
      background-color: rgba(0, 0, 0, 0.04);
    }

    .affine-database-block-add-row {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 100%;
      height: 100%;
      cursor: pointer;
      user-select: none;
      font-size: 14px;
    }
    .affine-database-block-add-row svg {
      width: 16px;
      height: 16px;
    }

    .affine-database-add-column-button {
      position: absolute;
      top: 58px;
      right: -40px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      cursor: pointer;
    }
  `;

  @property()
  model!: DatabaseBlockModel;

  @property()
  host!: BlockHost;

  @query('.affine-database-block-title')
  private _container!: HTMLDivElement;

  @query('.affine-database-search-input')
  private _searchInput!: HTMLInputElement;

  @query('affine-database-column-header')
  private _columnHeaderComponent!: DatabaseColumnHeader;

  @state()
  private _searchState: SearchState = SearchState.SearchIcon;

  @state()
  private _filteredRowIds: string[] = [];

  @state()
  private _hoverState = false;

  private _vEditor: VEditor | null = null;
  private _disposables: DisposableGroup = new DisposableGroup();

  get columns(): ColumnSchema[] {
    return this.model.columns.map(id =>
      this.model.page.db.getColumnSchema(id)
    ) as ColumnSchema[];
  }

  connectedCallback() {
    super.connectedCallback();
    const disposables = this._disposables;

    disposables.addFromEvent(this, 'mouseover', this._onMouseOver);
    disposables.addFromEvent(this, 'mouseleave', this._onMouseLeave);
    disposables.addFromEvent(this, 'click', this._onClick);
  }

  firstUpdated() {
    this._initTitleVEditor();

    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
  }

  private _getDatabaseMap() {
    const databaseMap: DatabaseMap = {};
    for (const child of this.model.children) {
      // The first value is the text context of the row block
      databaseMap[child.id] = [child.text?.toString() ?? ''];
    }

    const nestedColumns = this.model.page.db.columnJSON;
    const rowIds = this.model.children.map(child => child.id);

    rowIds.forEach(blockId => {
      // The map containing all columns related to this row (block)
      const columnMap = nestedColumns[blockId];
      if (!columnMap) return;

      // Flatten the columnMap into a list of values
      const columnValues = Object.keys(columnMap).map(
        key => columnMap[key].value + ''
      );
      databaseMap[blockId].push(...columnValues);
    });

    return databaseMap;
  }

  private _onSearch = (event: InputEvent) => {
    const el = event.target as HTMLInputElement;
    const inputValue = el.value.trim();
    this._searchState = SearchState.Searching;
    if (inputValue === '') {
      this._searchState = SearchState.SearchInput;
    }

    const databaseMap = this._getDatabaseMap();
    const existingRowIds = Object.keys(databaseMap).filter(key => {
      return (
        databaseMap[key].findIndex(item =>
          item.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())
        ) > -1
      );
    });

    this._filteredRowIds = this.model.children
      .filter(child => existingRowIds.includes(child.id))
      .map(child => child.id);

    // When deleting the search content, the rich-text in the database row will automatically get the focus,
    // causing the search box to blur. So, here we manually make it focus.
    requestAnimationFrame(() => el.focus());
  };

  private _onSearchKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this._resetSearchStatus();
    }
  };

  private _clearSearch = (event: MouseEvent) => {
    event.stopPropagation();
    this._resetSearchStatus();
  };

  private _resetSearchStatus = () => {
    this._searchInput.value = '';
    this._filteredRowIds = [];
    this._searchState = SearchState.SearchIcon;
  };

  private _onShowSearch = () => {
    this._searchState = SearchState.SearchInput;
    setTimeout(() => {
      this._searchInput.focus();
      onClickOutside(
        this._searchInput,
        () => {
          if (this._searchState !== SearchState.Searching) {
            this._searchState = SearchState.SearchIcon;
          }
        },
        'mousedown'
      );
    });
  };

  private _onMouseOver = () => {
    this._hoverState = true;
  };

  private _onMouseLeave = () => {
    if (this._searchState === SearchState.SearchIcon) {
      this._hoverState = false;
    }
  };

  private _onClick = () => {
    setTimeout(() => {
      onClickOutside(
        this,
        () => {
          if (this._searchState !== SearchState.Searching) {
            this._hoverState = false;
          }
        },
        'mousedown'
      );
    });
  };

  private _addRow = () => {
    this._searchState = SearchState.SearchIcon;
    this._hoverState = false;

    this.model.page.captureSync();
    this.model.page.addBlock('affine:paragraph', {}, this.model.id);
  };

  private _addColumn = (index: number) => {
    this.model.page.captureSync();
    const defaultColumnType = 'multi-select';
    const renderer = getColumnSchemaRenderer(defaultColumnType);
    const schema: Omit<ColumnSchema, 'id'> = {
      type: defaultColumnType,
      // TODO: change to dynamic number
      name: 'Column n',
      width: 200,
      hide: false,
      ...renderer.propertyCreator(),
    };
    const id = this.model.page.db.updateColumnSchema(schema);
    const newColumns = [...this.model.columns];
    newColumns.splice(index, 0, id);
    this.model.page.updateBlock(this.model, {
      columns: newColumns,
    });

    requestAnimationFrame(() => {
      this._columnHeaderComponent.setEditingColumnId(id);
    });
  };

  private _initTitleVEditor() {
    this._vEditor = new VEditor(this.model.title.yText);
    setupVirgoScroll(this.model.page, this._vEditor);
    this._vEditor.mount(this._container);
    this._vEditor.setReadonly(this.model.page.readonly);

    // for title placeholder
    this.model.title.yText.observe(() => {
      this.requestUpdate();
    });

    // after the database structure is created
    requestAnimationFrame(() => {
      this._vEditor?.focusEnd();
    });
  }

  private _renderToolbar = () => {
    if (!this._hoverState)
      return html`<div class="affine-database-toolbar-search">
        ${DatabaseSearchIcon}
      </div>`;

    const searchTool = html`
      <div
        class="affine-database-search-container ${this._searchState !==
        SearchState.SearchIcon
          ? 'search-container-expand'
          : ''}"
        @click=${this._onShowSearch}
      >
        <div class="affine-database-search-input-icon">
          ${DatabaseSearchIcon}
        </div>
        <div class="search-input-container">
          <input
            placeholder="Search..."
            class="affine-database-search-input"
            @input=${this._onSearch}
            @keydown=${this._onSearchKeydown}
          />
          <span class="close-icon" @click=${this._clearSearch}>x</span>
        </div>
      </div>
    `;

    return html`<div class="affine-database-toolbar">
      <div class="affine-database-toolbar-item search">${searchTool}</div>
      <div class="affine-database-toolbar-item">${MoreHorizontalIcon}</div>
      <div class="affine-database-toolbar-item new-record">
        ${PlusIcon}<span>New Record</span>
      </div>
    </div>`;
  };

  render() {
    const totalWidth =
      this.columns.map(column => column.width).reduce((t, x) => t + x, 0) +
      FIRST_LINE_TEXT_WIDTH +
      ADD_COLUMN_BUTTON_WIDTH;

    const isEmpty = !this.model.title || !this.model.title.length;

    return html`
      <div class="affine-database-block-container">
        <div class="affine-database-block-title-container">
          <div
            class="affine-database-block-title ${isEmpty
              ? 'affine-database-block-title-empty'
              : ''}"
            data-block-is-database-title="true"
          ></div>
          ${this._renderToolbar()}
        </div>
        <div class="affine-database-block-table">
          <div
            style=${styleMap({
              width: `${totalWidth}px`,
            })}
          >
            <affine-database-column-header
              .columns=${this.columns}
              .targetModel=${this.model}
              .addColumn=${this._addColumn}
            ></affine-database-column-header>
            ${DataBaseRowContainer(
              this,
              this._filteredRowIds,
              this._searchState
            )}
            <div class="affine-database-block-footer">
              <div
                class="affine-database-block-add-row"
                data-test-id="affine-database-add-row-button"
                role="button"
                @click=${this._addRow}
              >
                ${PlusIcon}<span>New Record</span>
              </div>
            </div>
          </div>
        </div>

        <div
          class="affine-database-add-column-button"
          data-test-id="affine-database-add-column-button"
          @click=${() => this._addColumn(this.columns.length)}
        >
          <!-- Fix move to icon -->
          <svg
            viewBox="0 0 16 16"
            style=${styleMap({
              width: '12px',
              height: '100%',
              fill: 'var(--affine-text-color)',
            })}
          >
            <path
              d="M7.977 14.963c.407 0 .747-.324.747-.723V8.72h5.362c.399 0 .74-.34.74-.747a.746.746 0 00-.74-.738H8.724V1.706c0-.398-.34-.722-.747-.722a.732.732 0 00-.739.722v5.529h-5.37a.746.746 0 00-.74.738c0 .407.341.747.74.747h5.37v5.52c0 .399.332.723.739.723z"
            ></path>
          </svg>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlockComponent;
  }
}
