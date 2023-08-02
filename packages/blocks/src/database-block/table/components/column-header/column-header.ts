import './database-header-column.js';

import { DatabaseAddColumn } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { getDefaultPageByElement } from '../../../../__internal__/index.js';
import { DEFAULT_COLUMN_TITLE_HEIGHT } from '../../consts.js';
import type { DataViewTableManager } from '../../table-view-manager.js';
import { styles } from './styles.js';

@customElement('affine-database-column-header')
export class DatabaseColumnHeader extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  tableViewManager!: DataViewTableManager;

  @query('.affine-database-column-header')
  private _headerContainer!: HTMLElement;

  @query('.affine-database-add-column-button')
  private _addColumnButton!: HTMLElement;

  @query('.header-add-column-button')
  private _headerAddColumnButton!: HTMLElement;

  private _isHeaderHover = false;

  private get readonly() {
    return this.tableViewManager.readonly;
  }

  override firstUpdated() {
    if (this.readonly) return;
    this._disposables.add(
      this.tableViewManager.slots.update.on(() => {
        this.requestUpdate();
      })
    );

    this._initHeaderMousemoveHandlers();

    const databaseElement = this.closest('.data-view-root');
    if (databaseElement) {
      this._initResizeEffect(databaseElement);
    }
  }

  private _initResizeEffect(element: Element) {
    const pageBlock = getDefaultPageByElement(this);
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
    const databaseElement = this.closest('.data-view-root');
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
    this.tableViewManager.columnAdd('end');
    Promise.resolve().then(() => {
      this.editLastColumnTitle();
    });
  };

  editLastColumnTitle = () => {
    const columns = this.querySelectorAll('affine-database-header-column');
    const column = columns.item(columns.length - 1);
    column.editTitle();
    column.scrollIntoView();
  };

  override render() {
    return html`
      <div class="affine-database-column-header database-row">
        ${repeat(
          this.tableViewManager.columnManagerList,
          column => column.id,
          (column, index) => {
            const style = styleMap({
              width: `${column.width}px`,
            });
            return html` <affine-database-header-column
              style="${style}"
              data-column-id="${column.id}"
              data-column-index="${index}"
              class="affine-database-column database-cell"
              .column="${column}"
              .tableViewManager="${this.tableViewManager}"
            ></affine-database-header-column>`;
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
