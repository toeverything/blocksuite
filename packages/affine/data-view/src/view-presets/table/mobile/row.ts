import { popupTargetFromElement } from '@blocksuite/affine-components/context-menu';
import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { CenterPeekIcon, MoreHorizontalIcon } from '@blocksuite/icons/lit';
import { css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { DataViewRenderer } from '../../../core/data-view.js';
import type { TableSingleView } from '../table-view-manager.js';

import { popMobileRowMenu } from './menu.js';

export class MobileTableRow extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    .mobile-table-row {
      width: 100%;
      display: flex;
      flex-direction: row;
      border-bottom: 1px solid var(--affine-border-color);
      position: relative;
      min-height: 34px;
    }

    .mobile-row-ops {
      position: relative;
      width: 0;
      margin-top: 5px;
      height: max-content;
      display: flex;
      gap: 4px;
      cursor: pointer;
      justify-content: end;
      right: 8px;
    }

    .affine-database-block-row:has([data-editing='true']) .mobile-row-ops {
      visibility: hidden;
      opacity: 0;
    }

    .mobile-row-op {
      display: flex;
      padding: 4px;
      border-radius: 4px;
      box-shadow: 0px 0px 4px 0px rgba(66, 65, 73, 0.14);
      background-color: var(--affine-background-primary-color);
      position: relative;
      font-size: 16px;
      color: ${unsafeCSSVarV2('icon/primary')};
    }
  `;

  get groupKey() {
    return this.closest('affine-data-view-table-group')?.group?.key;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('mobile-table-row');
  }

  protected override render(): unknown {
    const view = this.view;
    return html`
      ${repeat(
        view.properties$.value,
        v => v.id,
        (column, i) => {
          const clickDetail = () => {
            this.dataViewEle.openDetailPanel({
              view: this.view,
              rowId: this.rowId,
            });
          };
          const openMenu = (e: MouseEvent) => {
            const ele = e.currentTarget as HTMLElement;
            popMobileRowMenu(
              popupTargetFromElement(ele),
              this.rowId,
              this.dataViewEle,
              this.view
            );
          };
          return html`
            <div style="display: flex;">
              <mobile-table-cell
                class="mobile-table-cell"
                style=${styleMap({
                  width: `${column.width$.value}px`,
                  border: i === 0 ? 'none' : undefined,
                })}
                .view="${view}"
                .column="${column}"
                .rowId="${this.rowId}"
                data-row-id="${this.rowId}"
                .rowIndex="${this.rowIndex}"
                data-row-index="${this.rowIndex}"
                .columnId="${column.id}"
                data-column-id="${column.id}"
                .columnIndex="${i}"
                data-column-index="${i}"
              >
              </mobile-table-cell>
              <div class="cell-divider"></div>
            </div>
            ${!column.readonly$.value &&
            column.view.mainProperties$.value.titleColumn === column.id
              ? html` <div class="mobile-row-ops">
                  <div class="mobile-row-op" @click="${clickDetail}">
                    ${CenterPeekIcon()}
                  </div>
                  ${!view.readonly$.value
                    ? html` <div class="mobile-row-op" @click="${openMenu}">
                        ${MoreHorizontalIcon()}
                      </div>`
                    : nothing}
                </div>`
              : nothing}
          `;
        }
      )}
      <div class="database-cell add-column-button"></div>
    `;
  }

  @property({ attribute: false })
  accessor dataViewEle!: DataViewRenderer;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor rowIndex!: number;

  @property({ attribute: false })
  accessor view!: TableSingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'mobile-table-row': MobileTableRow;
  }
}
