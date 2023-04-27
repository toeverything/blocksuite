import './cell-container.js';

import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { BlockElementWithService } from '../../__internal__/service/components.js';
import { ShadowlessElement, WithDisposable } from '../../std.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../consts.js';
import type { DatabaseBlockComponent } from '../database-block.js';
import { SearchState } from '../types.js';

@customElement('affine-database-row-container')
export class DataBaseRowContainer extends WithDisposable(ShadowlessElement) {
  static override styles = css`
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
      background: var(--affine-hover-color);
    }
    .affine-database-block-row > .database-cell {
      background: var(--affine-white);
    }

    .affine-database-block-row-cell-content {
      display: flex;
      align-items: center;
      height: 100%;
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
  `;

  @property()
  databaseBlock!: DatabaseBlockComponent;

  @property()
  filteredRowIds!: string[];

  @property()
  searchState!: SearchState;

  private get databaseModel() {
    return this.databaseBlock.model;
  }
  private get columns() {
    return this.databaseModel.columns;
  }

  override connectedCallback() {
    super.connectedCallback();

    // prevent block selection
    const onStopPropagation = (event: Event) => event.stopPropagation();
    this._disposables.addFromEvent(this, 'pointerdown', onStopPropagation);
    this._disposables.addFromEvent(this, 'pointermove', onStopPropagation);
  }

  private get filteredChildren() {
    return this.searchState === SearchState.Searching
      ? this.databaseModel.children.filter(
          child => this.filteredRowIds.indexOf(child.id) > -1
        )
      : this.databaseModel.children;
  }

  protected override render() {
    return html`<div class="affine-database-block-rows">
      ${repeat(
        this.filteredChildren,
        child => child.id,
        (child, idx) => {
          const style = styleMap({
            width: `${this.databaseModel.titleColumnWidth}px`,
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
                  ${BlockElementWithService(child, this.databaseBlock, () => {
                    this.databaseBlock.requestUpdate();
                  })}
                </div>
              </div>
              ${repeat(this.columns, column => {
                return html`
                  <div
                    class="database-cell"
                    style=${styleMap({
                      width: `${column.width}px`,
                    })}
                  >
                    <affine-database-cell-container
                      .databaseModel=${this.databaseModel}
                      .rowModel=${child}
                      .column=${column}
                      .columnRenderer=${this.databaseBlock.columnRenderer}
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
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-row-container': DataBaseRowContainer;
  }
}
