import './database-header-column.js';

import { DatabaseAddColumn } from '@blocksuite/global/config';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { getDefaultPage } from '../../../../__internal__/index.js';
import type { TableViewData } from '../../../common/view-manager.js';
import type { DatabaseBlockModel } from '../../../database-model.js';
import { DEFAULT_COLUMN_TITLE_HEIGHT } from '../../consts.js';
import type {
  ColumnManager,
  TableViewManager,
} from '../../table-view-manager.js';
import { styles } from './styles.js';

@customElement('affine-database-column-header')
export class DatabaseColumnHeader extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property()
  tableViewManager!: TableViewManager;

  @property()
  targetModel!: DatabaseBlockModel;

  @property()
  view!: TableViewData;

  @property()
  columns!: ColumnManager[];

  @property()
  addColumn!: (index: number) => string;

  get tableContainer(): HTMLElement {
    return this.parentElement as HTMLElement;
  }

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

  private _columnWidthDisposables: DisposableGroup = new DisposableGroup();
  private _isHeaderHover = false;

  private get readonly() {
    return this.tableViewManager.readonly;
  }

  setEditingColumnId = (id: string) => {
    this._editingColumnId = id;
  };

  override firstUpdated() {
    if (this.readonly) return;

    this._initSetDragHandleHeightEffect();
    this._initHeaderMousemoveHandlers();

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

    // When dragging a block or adding a new row to the database, the changedProperties.size is 0
    if (changedProperties.size === 0 || changedProperties.has('columns')) {
      this._setDragHandleHeight();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._columnWidthDisposables.dispose();
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

  private _initSetDragHandleHeightEffect() {
    const mutationObserver = new MutationObserver(() => {
      this._setDragHandleHeight();
    });
    const tableContainer = this.closest('.affine-database-table-container');
    assertExists(tableContainer);
    mutationObserver.observe(tableContainer, {
      childList: true,
      subtree: true,
    });
    this._disposables.add(() => mutationObserver.disconnect());
  }

  private _setDragHandleHeight() {
    const databaseElement = this.closest('affine-database');
    // When dragging to generate a database preview,
    // the database may not be rendered to the page in time
    if (!databaseElement) return;
    const databaseBody = databaseElement.querySelector(
      '.affine-database-block-rows'
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

  private _onAddColumn = () => {
    if (this.readonly) return;
    this.tableViewManager.newColumn('end');
  };

  override render() {
    return html`
      <div class="affine-database-column-header database-row">
        ${repeat(
          this.columns,
          column => column.id,
          (column, index) => {
            const style = styleMap({
              width: `${column.width}px`,
            });
            return html` <div
              data-column-id="${column.id}"
              class="affine-database-column database-cell"
              style=${style}
            >
              <affine-database-header-column
                .column=${column}
                .tableViewManager=${this.tableViewManager}
              ></affine-database-header-column>
            </div>`;
          }
        )}
        <div class="affine-database-column database-cell add-column-button">
          ${this.readonly
            ? null
            : html` <div
                class="header-add-column-button"
                @click="${this._onAddColumn}"
              >
                ${DatabaseAddColumn}
              </div>`}
        </div>
        ${this.readonly
          ? null
          : html` <div
              class="affine-database-add-column-button"
              data-test-id="affine-database-add-column-button"
              @click="${this._onAddColumn}"
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
