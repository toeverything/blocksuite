// related component
import './components/column-header/column-header.js';
import './components/cell-container.js';
import './components/toolbar/toolbar.js';
import './components/database-title.js';

import { PlusIcon } from '@blocksuite/global/config';
import { type Column } from '@blocksuite/global/database';
import { assertExists } from '@blocksuite/global/utils';
import { css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import {
  asyncFocusRichText,
  type BlockHost,
  WithDisposable,
} from '../__internal__/index.js';
import { ShadowlessElement } from '../__internal__/utils/lit.js';
import { tooltipStyle } from '../components/tooltip/tooltip.js';
import type { DatabaseColumnHeader } from './components/column-header/column-header.js';
import { registerInternalRenderer } from './components/column-type/index.js';
import { DataBaseRowContainer } from './components/row-container.js';
import { DEFAULT_COLUMN_WIDTH } from './consts.js';
import type { DatabaseBlockModel } from './database-model.js';
import { SearchState } from './types.js';
import { onClickOutside } from './utils.js';

const styles = css`
  affine-database {
    position: relative;
  }

  .affine-database-block-title-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    margin: 12px 0px;
  }

  .affine-database-block-table {
    position: relative;
    width: 100%;
    overflow-x: scroll;
    border-top: 1.5px solid var(--affine-border-color);
  }

  .affine-database-table-container {
    width: fit-content;
    min-width: 100%;
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
  }
  .affine-database-block-footer:hover {
    background-color: var(--affine-hover-color);
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
  extends WithDisposable(ShadowlessElement)
  implements BlockHost
{
  flavour = 'affine:database' as const;

  static override styles = styles;

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

  @query('affine-database-column-header')
  private _columnHeaderComponent!: DatabaseColumnHeader;

  @state()
  private _searchState: SearchState = SearchState.SearchIcon;

  @state()
  private _filteredRowIds: string[] = [];

  @state()
  private _hoverState = false;

  private _columnRenderer = registerInternalRenderer();
  get columnRenderer() {
    return this._columnRenderer;
  }

  private get columns(): Column[] {
    return this.model.columns;
  }

  private get readonly() {
    return this.model.page.readonly;
  }

  override connectedCallback() {
    super.connectedCallback();

    const disposables = this._disposables;
    disposables.addFromEvent(this, 'mouseover', this._onMouseOver);
    disposables.addFromEvent(this, 'mouseleave', this._onMouseLeave);
    disposables.addFromEvent(this, 'click', this._onClick);

    const onStopPropagation = (event: Event) => event.stopPropagation();
    disposables.addFromEvent(this, 'mousedown', onStopPropagation);
    disposables.addFromEvent(this, 'mousemove', onStopPropagation);
  }

  override firstUpdated() {
    this.model.propsUpdated.on(() => {
      this.requestUpdate();
      // TODO: optimize performance here
      this.querySelectorAll('affine-database-cell-container').forEach(cell => {
        cell.requestUpdate();
      });
      this.querySelector('affine-database-column-header')?.requestUpdate();
    });
    this.model.childrenUpdated.on(() => {
      this.requestUpdate();
      // TODO: optimize performance here
      this.querySelectorAll('affine-database-cell-container').forEach(cell => {
        cell.requestUpdate();
      });
      this.querySelector('affine-database-column-header')?.requestUpdate();
    });

    if (this.readonly) return;
    const tableContent = this._tableContainer.parentElement;
    assertExists(tableContent);
    this._disposables.addFromEvent(
      tableContent,
      'scroll',
      this._onDatabaseScroll
    );
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
    if (this.readonly) return;

    const currentSearchState = this._searchState;
    this._resetSearchState();
    this._resetHoverState();

    const page = this.model.page;
    page.captureSync();
    const id = page.addBlock('affine:paragraph', {}, this.model.id, index);
    asyncFocusRichText(page, id);
    requestAnimationFrame(() => {
      this._columnHeaderComponent.setDragHandleHeight();
    });
    // save the search state
    this._setSearchState(currentSearchState);
  };

  private _addColumn = (index: number) => {
    if (this.readonly) return;

    this.model.page.captureSync();
    const currentColumns = this.model.columns;
    const defaultColumnType = 'multi-select';
    const renderer = this._columnRenderer.get(defaultColumnType);
    const schema: Omit<Column, 'id'> = {
      type: defaultColumnType,
      name: `Column ${currentColumns.length + 1}`,
      width: DEFAULT_COLUMN_WIDTH,
      hide: false,
      ...renderer.propertyCreator(),
    };
    const id = this.model.addColumn(schema, index);
    this.model.applyColumnUpdate();

    requestAnimationFrame(() => {
      this._columnHeaderComponent.setEditingColumnId(id);
    });
  };

  override render() {
    const rows = DataBaseRowContainer(
      this,
      this._filteredRowIds,
      this._searchState
    );

    return html`
      <div class="affine-database-block-container">
        <div class="affine-database-block-title-container">
          <affine-database-title
            .addRow=${this._addRow}
            .targetModel=${this.model}
          ></affine-database-title>
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
              .columnRenderer=${this.columnRenderer}
            ></affine-database-column-header>
            ${rows}
          </div>
        </div>
        ${this.readonly
          ? null
          : html`<div class="affine-database-block-footer">
              <div
                class="affine-database-block-add-row"
                data-test-id="affine-database-add-row-button"
                role="button"
                @click=${() => this._addRow()}
              >
                ${PlusIcon}<span>New Record</span>
              </div>
            </div>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlockComponent;
  }
}
