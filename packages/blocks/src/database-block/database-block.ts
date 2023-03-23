// related component
import './components/add-column-type-popup.js';
import './components/cell-container.js';

import { SearchIcon } from '@blocksuite/global/config';
import type { BlockColumn, ColumnSchema } from '@blocksuite/global/database';
import { assertEquals, DisposableGroup } from '@blocksuite/global/utils';
import { VEditor } from '@blocksuite/virgo';
import { createPopper } from '@popperjs/core';
import { css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html, unsafeStatic } from 'lit/static-html.js';

import { type BlockHost } from '../__internal__/index.js';
import { BlockElementWithService } from '../__internal__/service/components.js';
import { NonShadowLitElement } from '../__internal__/utils/lit.js';
import { setUpVirgoScroll } from '../__internal__/utils/virgo.js';
import type { DatabaseAddColumnTypePopup } from './components/add-column-type-popup.js';
import { DATABASE_ADD_COLUMN_TYPE_POPUP } from './components/add-column-type-popup.js';
import { registerInternalRenderer } from './components/column-type/index.js';
import { EditColumnPopup } from './components/edit-column-popup.js';
import type { DatabaseBlockModel } from './database-model.js';
import { DatabaseBlockDisplayMode } from './database-model.js';
import { getColumnSchemaRenderer } from './register.js';
import { onClickOutside } from './utils.js';

type SerializedNestedColumns = {
  // row
  [key: string]: {
    // column
    [key: string]: BlockColumn;
  };
};

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

/** column tag color poll */
// const columnTagColors = [
//   '#F5F5F5',
//   '#E3E2E0',
//   '#FFE1E1',
//   '#FFEACA',
//   '#FFF4D8',
//   '#DFF4E8',
//   '#DFF4F3',
//   '#E1EFFF',
//   '#F3F0FF',
//   '#FCE8FF',
// ];

let once = true;
if (once) {
  registerInternalRenderer();
  once = false;
}

function DatabaseHeader(block: DatabaseBlockComponent) {
  return html`
    <div class="affine-database-block-header">
      <div
        class="affine-database-block-column"
        data-column-id="-1"
        style=${styleMap({
          minWidth: `${FIRST_LINE_TEXT_WIDTH}px`,
          maxWidth: `${FIRST_LINE_TEXT_WIDTH}px`,
        })}
      >
        Title
      </div>
      ${repeat(
        block.columns,
        column => column.id,
        column => {
          return html`
            <div
              class="affine-database-block-column"
              data-column-id="${column.id}"
              style=${styleMap({
                minWidth: `${column.internalProperty.width}px`,
                maxWidth: `${column.internalProperty.width}px`,
              })}
              @click=${(event: MouseEvent) => {
                const editColumn = new EditColumnPopup();
                editColumn.targetModel = block.model;
                editColumn.targetColumnSchema = column;
                document.body.appendChild(editColumn);
                requestAnimationFrame(() => {
                  createPopper(event.target as Element, editColumn, {
                    placement: 'bottom',
                  });
                  onClickOutside(editColumn, ele => ele.remove(), 'mousedown');
                });
              }}
            >
              ${column.name}
            </div>
          `;
        }
      )}
      <div
        class="affine-database-block-add-column-button"
        data-test-id="affine-database-add-column-button"
        @click=${() => {
          block.addColumnTypePopup.show = true;
        }}
      >
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

function DataBaseRowContainer(
  databaseBlock: DatabaseBlockComponent,
  filteredRowIds: string[],
  searchState: SearchState
) {
  const databaseModel = databaseBlock.model;
  assertEquals(databaseModel.mode, DatabaseBlockDisplayMode.Database);

  const filteredChildren =
    searchState === SearchState.Searching
      ? databaseModel.children.filter(
          child => filteredRowIds.indexOf(child.id) > -1
        )
      : databaseModel.children;

  return html`
    <style>
      .affine-database-block-header {
        display: flex;
        flex-direction: row;
      }

      .affine-database-block-column {
        display: flex;
        align-items: center;
        width: 145px;
        height: 40px;
        padding: 8px;
        border-right: 1px solid var(--affine-border-color);
      }

      .affine-database-block-column:hover {
        background: linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.04),
            rgba(0, 0, 0, 0.04)
          ),
          #ffffff;
      }

      .affine-database-block-rows {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
      }

      .affine-database-block-row {
        width: 100%;
        height: 44px;
        display: flex;
        flex-direction: row;
        border-bottom: 1px solid var(--affine-border-color);
      }
      .affine-database-block-row:nth-of-type(1) {
        border-top: 1px solid var(--affine-border-color);
      }

      .affine-database-block-row-cell {
        display: flex;
        align-item: center;
        width: 145px;
        height: 44px;
        padding: 0 8px;
        border-right: 1px solid var(--affine-border-color);
      }
      .affine-database-block-row-cell > affine-paragraph {
        height: 100%;
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
  implements BlockHost
{
  flavour = 'affine:database' as const;
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
    }

    .affine-database-toolbar {
      display: flex;
      align-items: center;
    }

    .affine-database-toolbar-item {
      margin: 0 5px;
    }

    .affine-database-toolbar-item.search {
      display: flex;
      align-items: center;
    }
    .affine-database-search-input-icon {
      display: inline-flex;
    }
    .affine-database-search-input-icon svg {
      width: 14px;
    }

    .affine-database-search-input {
      height: 32px;
      min-width: 80px;
      border: none;
      border-radius: 10px;
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

    .affine-database-block {
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

    .affine-database-block-title-container {
      display: flex;
      align-items: center;
      height: 44px;
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
      width: 100%;
      height: 100%;
      text-align: center;
      cursor: pointer;
      user-select: none;
    }

    .affine-database-block-add-column-button {
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

  @query(DATABASE_ADD_COLUMN_TYPE_POPUP)
  addColumnTypePopup!: DatabaseAddColumnTypePopup;

  @query('.affine-database-block-title')
  private _container!: HTMLDivElement;

  @query('.affine-database-search-input')
  private _searchInput!: HTMLInputElement;

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
      this.model.page.getColumnSchema(id)
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

    const nestedColumns =
      this.model.page.columns.toJSON() as SerializedNestedColumns;
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

  private _addColumn = (columnType: ColumnSchema['type']) => {
    this.model.page.captureSync();
    const renderer = getColumnSchemaRenderer(columnType);
    const schema: Omit<ColumnSchema, 'id'> = {
      type: columnType,
      name: 'new column',
      internalProperty: {
        width: 200,
        hide: false,
        color: '#000',
      },
      property: renderer.propertyCreator(),
    };
    const id = this.model.page.setColumnSchema(schema);
    this.model.page.updateBlock(this.model, {
      columns: [...this.model.columns, id],
    });
  };

  private _initTitleVEditor() {
    this._vEditor = new VEditor(this.model.title.yText);
    setUpVirgoScroll(this.model.page, this._vEditor);
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
    if (!this._hoverState) return html``;

    const searchTool =
      this._searchState !== SearchState.SearchIcon
        ? html`<div class="search-input-container">
            <input
              placeholder="Search..."
              class="affine-database-search-input"
              @input=${this._onSearch}
              @keydown=${this._onSearchKeydown}
            />
            <span class="close-icon" @click=${this._resetSearchStatus}>x</span>
          </div>`
        : html`
            <span
              class="affine-database-search-input-icon"
              @click=${this._onShowSearch}
            >
              ${SearchIcon}
            </span>
          `;

    return html`<div class="affine-database-toolbar">
      <div class="affine-database-toolbar-item">+ Add Record</div>
      <div class="affine-database-toolbar-item search">${searchTool}</div>
      <div class="affine-database-toolbar-item">...</div>
    </div>`;
  };

  /* eslint-disable lit/binding-positions, lit/no-invalid-html */
  render() {
    const totalWidth =
      this.columns
        .map(column => column.internalProperty.width)
        .reduce((t, x) => t + x, 0) +
      FIRST_LINE_TEXT_WIDTH +
      ADD_COLUMN_BUTTON_WIDTH;

    const isEmpty = !this.model.title || !this.model.title.length;

    return html`
      <div class="affine-database-block-container">
        <div class="affine-database-block-title-container">
          <div class="affine-database-block-title ${
            isEmpty ? 'affine-database-block-title-empty' : ''
          }" data-block-is-title="true">
          </div>
          ${this._renderToolbar()}
        </div>
        <div class="affine-database-block">
          <div
            class="affine-database-block-container"
            style=${styleMap({
              width: `${totalWidth}px`,
            })}
          >
            ${DatabaseHeader(this)}
            ${DataBaseRowContainer(
              this,
              this._filteredRowIds,
              this._searchState
            )}
            <div class="affine-database-block-footer">
              <div class="affine-database-block-add-row"
                  data-test-id="affine-database-add-row-button"
                  role="button"
                  @click=${this._addRow}>
                + New
              </div>
            </div>
          </div>
        </div>
        <${unsafeStatic(DATABASE_ADD_COLUMN_TYPE_POPUP)}
          .onSelectType=${this._addColumn}
        ></${unsafeStatic(DATABASE_ADD_COLUMN_TYPE_POPUP)}>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlockComponent;
  }
}
