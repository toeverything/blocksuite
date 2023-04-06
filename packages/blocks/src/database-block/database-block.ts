// related component
import './components/column-header.js';
import './components/cell-container.js';

import {
  ArrowDownIcon,
  CopyIcon,
  DatabaseKanbanViewIcon,
  DatabaseSearchClose,
  DatabaseSearchIcon,
  DatabaseTableViewIcon,
  DeleteIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from '@blocksuite/global/config';
import { type Column } from '@blocksuite/global/database';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import { VEditor } from '@blocksuite/virgo';
import { createPopper } from '@popperjs/core';
import { css, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { copy } from '../__internal__/clipboard/utils.js';
import { asyncFocusRichText, type BlockHost } from '../__internal__/index.js';
import { BlockElementWithService } from '../__internal__/service/components.js';
import { ShadowlessElement } from '../__internal__/utils/lit.js';
import { setupVirgoScroll } from '../__internal__/utils/virgo.js';
import { toast } from '../components/toast.js';
import { tooltipStyle } from '../components/tooltip/tooltip.js';
import type { DatabaseColumnHeader } from './components/column-header.js';
import { registerInternalRenderer } from './components/column-type/index.js';
import { actionStyles } from './components/edit-column-popup.js';
import { DEFAULT_COLUMN_MIN_WIDTH, DEFAULT_COLUMN_WIDTH } from './consts.js';
import type { DatabaseBlockModel } from './database-model.js';
import { getColumnRenderer } from './register.js';
import type {
  SwitchViewAction,
  SwitchViewActionType,
  ToolbarAction,
  ToolbarActionType,
} from './types.js';
import { isDivider, onClickOutside } from './utils.js';

type CellValues = string[];

/**
 * Containing all the cell values in rows.
 * ```
 * { rowId: CellValues }
 * ```
 */
type DatabaseMap = Record<string, CellValues>;

const enum SearchState {
  /** show search input */
  SearchInput = 'input',
  /** show search icon */
  SearchIcon = 'icon',
  /** searching */
  Searching = 'searching',
  /** show more action */
  Action = 'action',
}

let once = true;
if (once) {
  registerInternalRenderer();
  once = false;
}

const toolbarActions: ToolbarAction[] = [
  {
    type: 'database-type',
    text: 'Database type',
    icon: DatabaseTableViewIcon,
  },
  {
    type: 'copy',
    text: 'Copy',
    icon: CopyIcon,
  },
  {
    type: 'divider',
  },
  {
    type: 'delete-database',
    text: 'Delete database',
    icon: DeleteIcon,
  },
];

const databaseTypes: SwitchViewAction[] = [
  {
    type: 'table-view',
    text: 'Table view',
    icon: DatabaseTableViewIcon,
  },
  {
    type: 'kanban-view',
    text: 'Kanban view',
    icon: DatabaseKanbanViewIcon,
  },
];

@customElement('affine-database-type-popup')
class DatabaseTypePopup extends LitElement {
  static styles = css`
    :host {
      width: 200px;
      padding: 8px;
      border: 1px solid #e3e2e4;
      border-radius: 4px;
      background: var(--affine-popover-background);
      box-shadow: var(--affine-popover-shadow);
    }
    :host * {
      box-sizing: border-box;
    }
    ${actionStyles}
    .action > svg {
      width: 16px;
      height: 16px;
      fill: #77757d;
    }
    .database-type {
      height: 30px;
      padding: 0;
      color: #8e8d91;
      font-size: 14px;
      cursor: unset;
    }
    .database-type:hover {
      background: none;
    }
    .selected {
      color: #5438ff;
      background: rgba(0, 0, 0, 0.02);
    }
    .selected svg {
      color: #5438ff;
    }
    .selected.table-view svg {
      fill: #5438ff;
    }
    .action.disabled {
      cursor: not-allowed;
    }
    .action.disabled:hover {
      background: unset;
    }
  `;

  @property()
  dbType!: SwitchViewActionType;

  render() {
    return html`
      <div class="affine-database-type-popup">
        <div class="action database-type">
          <div class="action-content"><span>Database type</span></div>
        </div>
        <div class="action-divider"></div>
        ${databaseTypes.map(column => {
          const isKanban = column.type === 'kanban-view';
          const selected = column.type === this.dbType && !isKanban;

          return html`
            <div
              class="action ${column.type} ${selected
                ? 'selected'
                : ''} ${isKanban ? 'disabled' : ''}"
            >
              <div class="action-content">
                ${column.icon}<span>${column.text}</span>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}

@customElement('affine-database-toolbar-action-popup')
class ToolbarActionPopup extends LitElement {
  static styles = css`
    :host {
      width: 200px;
      height: 128px;
      padding: 8px;
      border: 1px solid #e3e2e4;
      border-radius: 4px;
      box-shadow: 0px 0px 12px rgba(66, 65, 73, 0.14),
        inset 0px 0px 0px 0.5px #e3e3e4;
      z-index: var(--affine-z-index-popover);
      background: var(--affine-page-background);
    }
    :host * {
      box-sizing: border-box;
    }
    ${actionStyles}
    .action-content > svg {
      width: 20px;
      height: 20px;
      fill: #77757d;
    }
    .action > svg {
      width: 16px;
      height: 16px;
      fill: #77757d;
    }
    .database-type > svg {
      transform: rotate(-90deg);
    }
  `;

  targetModel!: DatabaseBlockModel;

  @property()
  close!: () => void;

  @query('.affine-database-toolbar-action-popup')
  private _container!: HTMLDivElement;

  private _databaseTypePopup!: DatabaseTypePopup | null;

  private _onActionClick = (
    event: MouseEvent,
    actionType: ToolbarActionType
  ) => {
    event.stopPropagation();

    if (actionType === 'delete-database') {
      const models = [this.targetModel, ...this.targetModel.children];
      models.forEach(model => this.targetModel.page.deleteBlock(model));
    } else if (actionType === 'copy') {
      copy({
        type: 'Block',
        models: [this.targetModel],
        startOffset: 0,
        endOffset: 0,
      });
      toast('Copied Database to clipboard');
    }

    this.close();
  };

  private _onShowDatabaseType = () => {
    if (this._databaseTypePopup) return;
    this._databaseTypePopup = new DatabaseTypePopup();
    this._databaseTypePopup.dbType = 'table-view';
    this._container.appendChild(this._databaseTypePopup);
    createPopper(this._container, this._databaseTypePopup, {
      placement: 'right-start',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [-9, 12],
          },
        },
      ],
    });
  };

  private _onHideDatabaseType = () => {
    if (this._databaseTypePopup) {
      this._databaseTypePopup?.remove();
      this._databaseTypePopup = null;
    }
  };

  private _renderActions = () => {
    return html`
      ${toolbarActions.map(action => {
        if (isDivider(action)) {
          return html`<div class="action-divider"></div>`;
        }

        const onMouseOver =
          action.type === 'database-type'
            ? this._onShowDatabaseType
            : this._onHideDatabaseType;

        return html`
          <div
            class="action ${action.type}"
            @mouseover=${onMouseOver}
            @click=${(event: MouseEvent) =>
              this._onActionClick(event, action.type)}
          >
            <div class="action-content">
              ${action.icon}<span>${action.text}</span>
            </div>
            ${action.type === 'database-type' ? ArrowDownIcon : html``}
          </div>
        `;
      })}
    `;
  };

  render() {
    return html`<div class="affine-database-toolbar-action-popup">
      ${this._renderActions()}
    </div>`;
  }
}

function DataBaseRowContainer(
  databaseBlock: DatabaseBlockComponent,
  filteredRowIds: string[],
  searchState: SearchState
) {
  const databaseModel = databaseBlock.model;
  const columns = databaseModel.columns.map(id =>
    databaseModel.page.db.getColumn(id)
  ) as Column[];

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
      .affine-database-block-row > .affine-database-block-row-cell:first-child {
        background: rgba(0, 0, 0, 0.04);
      }

      .affine-database-block-row-cell-content {
        display: flex;
        align-items: center;
        min-height: 44px;
        padding: 0 8px;
        border-right: 1px solid var(--affine-border-color);
        transform: translateX(0);
      }
      .affine-database-block-row-cell-content > affine-paragraph > .text {
        margin-top: unset;
      }
      .database-cell {
        min-width: ${DEFAULT_COLUMN_MIN_WIDTH}px;
      }
      .database-cell:last-child affine-database-cell-container {
        border-right: none;
      }
    </style>
    <div class="affine-database-block-rows">
      ${repeat(
        filteredChildren,
        child => child.id,
        (child, idx) => {
          const style = styleMap({
            width: `${databaseModel.titleColumnWidth}px`,
          });
          return html`
            <div
              class="affine-database-block-row database-row"
              data-row-id="${idx}"
            >
              <div
                class="affine-database-block-row-cell database-cell"
                style=${style}
              >
                <div class="affine-database-block-row-cell-content">
                  ${BlockElementWithService(child, databaseBlock, () => {
                    databaseBlock.requestUpdate();
                  })}
                </div>
              </div>
              ${repeat(columns, column => {
                return html`
                  <div
                    class="database-cell"
                    style=${styleMap({
                      width: `${column.width}px`,
                    })}
                  >
                    <affine-database-cell-container
                      .databaseModel=${databaseModel}
                      .rowModel=${child}
                      .columnSchema=${column}
                    >
                    </affine-database-cell-container>
                  </div>
                `;
              })}
              <div class="database-cell add-column-button"></div>
            </div>
          `;
        }
      )}
    </div>
  `;
}

const styles = css`
  affine-database {
    position: relative;
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

  .affine-database-block-title-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    margin: 12px 0px;
  }
  .database-title-container {
    flex: 1;
    max-width: 300px;
    min-width: 300px;
    height: 30px;
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

  .affine-database-toolbar-item.search {
    overflow: hidden;
  }
  .affine-database-block-table {
    position: relative;
    width: 100%;
    overflow-x: scroll;
    border-top: 1.5px solid var(--affine-border-color);
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
    justify-content: center;
  }
  .affine-database-toolbar-item.search-container {
    overflow: hidden;
  }
  .affine-database-toolbar-item.more-action {
    width: 32px;
    height: 32px;
    border-radius: 4px;
  }
  .affine-database-toolbar-item.more-action:hover,
  .more-action.active {
    background: rgba(0, 0, 0, 0.04);
  }
  .affine-database-search-container {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 16px;
    height: 32px;
    padding: 8px 0;
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0);
    transition: all 0.3s ease;
  }
  .affine-database-search-container > svg {
    min-width: 16px;
    min-height: 16px;
  }
  .search-container-expand {
    width: 138px;
    padding: 8px 12px;
    background-color: rgba(0, 0, 0, 0.04);
  }
  .search-input-container {
    display: flex;
    align-items: center;
  }
  .search-input-container > .close-icon {
    display: flex;
    align-items: center;
  }
  .close-icon .code {
    width: 31px;
    height: 18px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
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
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.04)),
      #ffffff;
  }
  .new-record > tool-tip {
    max-width: 280px;
  }
  .affine-database-table-container {
    width: fit-content;
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
    height: 28px;
    background: #fff;
  }
  .affine-database-block-footer:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
  .affine-database-block-footer:hover .affine-database-block-add-row {
    display: flex;
  }

  .affine-database-block-add-row {
    display: none;
    flex: 1;
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

  ${tooltipStyle}
`;

@customElement('affine-database')
export class DatabaseBlockComponent
  extends ShadowlessElement
  implements BlockHost
{
  flavour = 'affine:database' as const;

  static styles = styles;

  get slots() {
    return this.host.slots;
  }

  get page() {
    return this.host.page;
  }
  get clipboard() {
    return this.host.clipboard;
  }
  get getService() {
    return this.host.getService;
  }

  @property()
  model!: DatabaseBlockModel;

  @property()
  host!: BlockHost;

  @query('.affine-database-table-container')
  private _tableContainer!: HTMLDivElement;

  @query('.affine-database-block-title')
  private _titleContainer!: HTMLDivElement;

  @query('.affine-database-search-input')
  private _searchInput!: HTMLInputElement;

  @query('affine-database-column-header')
  private _columnHeaderComponent!: DatabaseColumnHeader;

  @query('.more-action')
  private _moreActionContainer!: HTMLDivElement;

  @query('.search-container')
  private _searchContainer!: HTMLDivElement;

  private _toolbarAction!: ToolbarActionPopup | undefined;

  @state()
  private _searchState: SearchState = SearchState.SearchIcon;

  @state()
  private _filteredRowIds: string[] = [];

  @state()
  private _hoverState = false;

  private _vEditor: VEditor | null = null;
  private _disposables: DisposableGroup = new DisposableGroup();

  get columns(): Column[] {
    return this.model.columns.map(id =>
      this.model.page.db.getColumn(id)
    ) as Column[];
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

    const tableContent = this._tableContainer.parentElement;
    assertExists(tableContent);
    this._disposables.addFromEvent(
      tableContent,
      'scroll',
      this._onDatabaseScroll
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
  }

  private _resetSearchState() {
    this._searchState = SearchState.SearchIcon;
  }

  private _resetHoverState() {
    this._hoverState = false;
  }

  private _onShowTitleTooltip = () => {
    // TODO: show tooltip according to title content(vEditor)
  };

  private get _databaseMap() {
    const databaseMap: DatabaseMap = {};
    for (const child of this.model.children) {
      // The first value is the text context of the row block
      databaseMap[child.id] = [child.text?.toString() ?? ''];
    }

    const { serializedCells } = this.model.page.db;
    const rowIds = this.model.children.map(child => child.id);

    rowIds.forEach(rowId => {
      // The map containing all columns related to this row (block)
      const columnMap = serializedCells[rowId];
      if (!columnMap) return;

      // Flatten the columnMap into a list of values
      const columnValues = Object.keys(columnMap).map(key => {
        const value = columnMap[key].value;
        if (Array.isArray(value)) {
          return value.map(item => item.value);
        }
        return columnMap[key].value + '';
      });
      databaseMap[rowId].push(...columnValues.flat());
    });

    return databaseMap;
  }

  private _onDatabaseScroll = (event: Event) => {
    this._columnHeaderComponent.showAddColumnButton();
  };

  private _onSearch = (event: InputEvent) => {
    const el = event.target as HTMLInputElement;
    const inputValue = el.value.trim();
    this._searchState = SearchState.Searching;
    if (inputValue === '') {
      this._searchState = SearchState.SearchInput;
    }

    const { _databaseMap } = this;
    const existingRowIds = Object.keys(_databaseMap).filter(key => {
      return (
        _databaseMap[key].findIndex(item =>
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
      if (this._searchInput.value) {
        this._searchInput.value = '';
        this._searchState = SearchState.SearchInput;
      } else {
        this._resetSearchStatus();
      }
    }
  };

  private _clearSearch = (event: MouseEvent) => {
    event.stopPropagation();
    this._searchInput.value = '';
    this._searchState = SearchState.SearchInput;
  };

  private _resetSearchStatus = () => {
    this._searchInput.value = '';
    this._filteredRowIds = [];
    this._resetSearchState();
    this._searchContainer.style.overflow = 'hidden';
  };

  private _onShowSearch = () => {
    this._searchState = SearchState.SearchInput;
    onClickOutside(
      this._searchInput,
      () => {
        if (this._searchState !== SearchState.Searching) {
          this._resetSearchState();
        }
      },
      'mousedown'
    );
  };

  private _onFocusSearchInput = () => {
    if (this._searchState === SearchState.SearchInput) {
      this._searchInput.focus();
      this._searchContainer.style.overflow = 'unset';
    } else {
      this._searchInput.blur();
    }
  };

  private _onShowAction = () => {
    if (this._toolbarAction) {
      this._closeToolbarAction();
      return;
    }
    this._searchState = SearchState.Action;
    this._toolbarAction = new ToolbarActionPopup();
    this._toolbarAction.targetModel = this.model;
    this._toolbarAction.close = this._closeToolbarAction;
    this._moreActionContainer.appendChild(this._toolbarAction);
    createPopper(this._moreActionContainer, this._toolbarAction, {
      placement: 'bottom',
    });
    onClickOutside(
      this._moreActionContainer,
      () => {
        this._closeToolbarAction();
      },
      'mousedown'
    );
  };

  private _closeToolbarAction = () => {
    this._toolbarAction?.remove();
    this._toolbarAction = undefined;
  };

  private _onMouseOver = () => {
    this._hoverState = true;
  };

  private _onMouseLeave = () => {
    if (this._searchState === SearchState.SearchIcon) {
      this._resetHoverState();
    }
  };

  private _onClick = () => {
    setTimeout(() => {
      onClickOutside(
        this,
        () => {
          if (this._searchState !== SearchState.Searching) {
            this._resetHoverState();
            this._resetSearchState();
          }
        },
        'mousedown'
      );
    });
  };

  private _addRow = (index?: number) => {
    this._resetSearchState();
    this._resetHoverState();

    const page = this.model.page;
    page.captureSync();
    const id = page.addBlock('affine:paragraph', {}, this.model.id, index);
    asyncFocusRichText(page, id);
    requestAnimationFrame(() => {
      this._columnHeaderComponent.setDragHandleHeight();
    });
  };

  private _addColumn = (index: number) => {
    this.model.page.captureSync();
    const defaultColumnType = 'multi-select';
    const renderer = getColumnRenderer(defaultColumnType);
    const schema: Omit<Column, 'id'> = {
      type: defaultColumnType,
      // TODO: change to dynamic number
      name: 'Column n',
      width: DEFAULT_COLUMN_WIDTH,
      hide: false,
      ...renderer.propertyCreator(),
    };
    const id = this.model.page.db.updateColumn(schema);
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
    this._vEditor.mount(this._titleContainer);
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
    if (!this._hoverState) return null;
    const expandSearch =
      this._searchState === SearchState.SearchInput ||
      this._searchState === SearchState.Searching;
    const isActiveMoreAction = this._searchState === SearchState.Action;
    const searchTool = html`
      <div
        class="affine-database-search-container ${expandSearch
          ? 'search-container-expand'
          : ''}"
        @click=${this._onShowSearch}
        @transitionend=${this._onFocusSearchInput}
      >
        <div class="affine-database-search-input-icon">
          ${DatabaseSearchIcon}
        </div>
        <div class="search-input-container">
          <input
            placeholder="Search..."
            class="affine-database-search-input"
            @input=${this._onSearch}
            @click=${(event: MouseEvent) => event.stopPropagation()}
            @keydown=${this._onSearchKeydown}
          />
          <div class="has-tool-tip close-icon" @click=${this._clearSearch}>
            ${DatabaseSearchClose}
            <tool-tip inert arrow tip-position="top" role="tooltip">
              <span class="code">Esc</span> to clear all
            </tool-tip>
          </div>
        </div>
      </div>
    `;

    return html`<div class="affine-database-toolbar">
      <div class="affine-database-toolbar-item search-container">
        ${searchTool}
      </div>
      <div
        class="affine-database-toolbar-item more-action ${isActiveMoreAction
          ? 'active'
          : ''}"
        @click=${this._onShowAction}
      >
        ${MoreHorizontalIcon}
      </div>
      <div
        class="has-tool-tip affine-database-toolbar-item new-record"
        @click=${() => this._addRow(0)}
      >
        ${PlusIcon}<span>New Record</span>
        <tool-tip inert arrow tip-position="top" role="tooltip"
          >You can drag this button to the desired location and add a record
        </tool-tip>
      </div>
    </div>`;
  };

  render() {
    const isEmpty = !this.model.title || !this.model.title.length;

    return html`
      <div class="affine-database-block-container">
        <div class="affine-database-block-title-container">
          <div
            class="has-tool-tip database-title-container"
            @mouseover=${this._onShowTitleTooltip}
          >
            <div
              class="affine-database-block-title ${isEmpty
                ? 'affine-database-block-title-empty'
                : ''}"
              data-block-is-database-title="true"
            ></div>
            <tool-tip inert arrow tip-position="top" role="tooltip"
              >Database hello new work is not only
            </tool-tip>
          </div>
          ${this._renderToolbar()}
        </div>
        <div class="affine-database-block-table">
          <div class="affine-database-table-container">
            <affine-database-column-header
              .columns=${this.columns}
              .targetModel=${this.model}
              .addColumn=${this._addColumn}
              .tableContainer=${this._tableContainer}
            ></affine-database-column-header>
            ${DataBaseRowContainer(
              this,
              this._filteredRowIds,
              this._searchState
            )}
          </div>
        </div>
        <div class="affine-database-block-footer">
          <div
            class="affine-database-block-add-row"
            data-test-id="affine-database-add-row-button"
            role="button"
            @click=${() => this._addRow()}
          >
            ${PlusIcon}<span>New Record</span>
          </div>
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
