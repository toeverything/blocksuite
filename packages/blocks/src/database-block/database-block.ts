// related component
import './components/column-header/column-header.js';
import './components/cell-container.js';
import './components/toolbar/toolbar.js';

import { PlusIcon } from '@blocksuite/global/config';
import { type Column } from '@blocksuite/global/database';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import { VEditor } from '@blocksuite/virgo';
import { css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { asyncFocusRichText, type BlockHost } from '../__internal__/index.js';
import { ShadowlessElement } from '../__internal__/utils/lit.js';
import { setupVirgoScroll } from '../__internal__/utils/virgo.js';
import { tooltipStyle } from '../components/tooltip/tooltip.js';
import type { DatabaseColumnHeader } from './components/column-header/column-header.js';
import { registerInternalRenderer } from './components/column-type/index.js';
import { DataBaseRowContainer } from './components/row-container.js';
import { DEFAULT_COLUMN_WIDTH } from './consts.js';
import type { DatabaseBlockModel } from './database-model.js';
import { getColumnRenderer } from './register.js';
import { SearchState } from './types.js';
import { onClickOutside } from './utils.js';

let once = true;
if (once) {
  registerInternalRenderer();
  once = false;
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

  .affine-database-block-table {
    position: relative;
    width: 100%;
    overflow-x: scroll;
    border-top: 1.5px solid var(--affine-border-color);
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

  private _setFilteredRowIds = (rowIds: string[]) => {
    this._filteredRowIds = rowIds;
  };

  private _setSearchState = (state: SearchState) => {
    this._searchState = state;
  };

  private _resetSearchState() {
    this._searchState = SearchState.SearchIcon;
  }

  private _resetHoverState() {
    this._hoverState = false;
  }

  private _onShowTitleTooltip = () => {
    // TODO: show tooltip according to title content(vEditor)
  };

  private _onDatabaseScroll = (event: Event) => {
    this._columnHeaderComponent.showAddColumnButton();
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

  render() {
    const isEmpty = !this.model.title || !this.model.title.length;

    const rows = DataBaseRowContainer(
      this,
      this._filteredRowIds,
      this._searchState
    );

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
          <affine-database-toolbar
            .addRow=${this._addRow}
            .targetModel=${this.model}
            .hoverState=${this._hoverState}
            .searchState=${this._searchState}
            .setSearchState=${this._setSearchState}
            .setFilteredRowIds=${this._setFilteredRowIds}
          ></affine-database-toolbar>
        </div>
        <div class="affine-database-block-table">
          <div class="affine-database-table-container">
            <affine-database-column-header
              .columns=${this.columns}
              .targetModel=${this.model}
              .addColumn=${this._addColumn}
              .tableContainer=${this._tableContainer}
            ></affine-database-column-header>
            ${rows}
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
