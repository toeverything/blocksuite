import {
  menu,
  type MenuConfig,
  popMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import {
  DeleteIcon,
  DuplicateIcon,
  InsertLeftIcon,
  InsertRightIcon,
  MoveLeftIcon,
  MoveRightIcon,
  ViewIcon,
} from '@blocksuite/icons/lit';
import { css } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { Property } from '../../../core/view-manager/property.js';
import type { NumberPropertyDataType } from '../../../property-presets/index.js';
import type { TableColumn, TableSingleView } from '../table-view-manager.js';

import { inputConfig, typeConfig } from '../../../core/common/property-menu.js';
import { numberFormats } from '../../../property-presets/number/utils/formats.js';
import { DEFAULT_COLUMN_TITLE_HEIGHT } from '../consts.js';

export class MobileTableColumnHeader extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    .mobile-table-column-header {
      display: flex;
      padding: 6px;
      gap: 6px;
      align-items: center;
    }

    .mobile-table-column-header-icon {
      font-size: 18px;
      color: ${unsafeCSSVarV2('database/textSecondary')};
      display: flex;
      align-items: center;
    }

    .mobile-table-column-header-name {
      font-weight: 500;
      font-size: 14px;
      color: ${unsafeCSSVarV2('database/textSecondary')};
    }
  `;

  private _clickColumn = () => {
    if (this.tableViewManager.readonly$.value) {
      return;
    }
    this.popMenu();
  };

  editTitle = () => {
    this._clickColumn();
  };

  private popMenu(ele?: HTMLElement) {
    const enableNumberFormatting =
      this.tableViewManager.featureFlags$.value.enable_number_formatting;

    popMenu(popupTargetFromElement(ele ?? this), {
      options: {
        title: {
          text: 'Property settings',
        },
        items: [
          inputConfig(this.column),
          typeConfig(this.column),
          // Number format begin
          ...(enableNumberFormatting
            ? [
                menu.subMenu({
                  name: 'Number Format',
                  hide: () =>
                    !this.column.dataUpdate ||
                    this.column.type$.value !== 'number',
                  options: {
                    title: {
                      text: 'Number Format',
                    },
                    items: [
                      numberFormatConfig(this.column),
                      ...numberFormats.map(format => {
                        const data = (
                          this.column as Property<
                            number,
                            NumberPropertyDataType
                          >
                        ).data$.value;
                        return menu.action({
                          isSelected: data.format === format.type,
                          prefix: html`<span
                            style="font-size: var(--affine-font-base); scale: 1.2;"
                            >${format.symbol}</span
                          >`,
                          name: format.label,
                          select: () => {
                            if (data.format === format.type) return;
                            this.column.dataUpdate(() => ({
                              format: format.type,
                            }));
                          },
                        });
                      }),
                    ],
                  },
                }),
              ]
            : []),
          // Number format end
          menu.group({
            items: [
              menu.action({
                name: 'Hide In View',
                prefix: ViewIcon(),
                hide: () =>
                  this.column.hide$.value ||
                  this.column.type$.value === 'title',
                select: () => {
                  this.column.hideSet(true);
                },
              }),
            ],
          }),
          menu.group({
            items: [
              menu.action({
                name: 'Insert Left Column',
                prefix: InsertLeftIcon(),
                select: () => {
                  this.tableViewManager.propertyAdd({
                    id: this.column.id,
                    before: true,
                  });
                  Promise.resolve()
                    .then(() => {
                      const pre =
                        this.previousElementSibling?.previousElementSibling;
                      if (pre instanceof MobileTableColumnHeader) {
                        pre.editTitle();
                        pre.scrollIntoView({
                          inline: 'nearest',
                          block: 'nearest',
                        });
                      }
                    })
                    .catch(console.error);
                },
              }),
              menu.action({
                name: 'Insert Right Column',
                prefix: InsertRightIcon(),
                select: () => {
                  this.tableViewManager.propertyAdd({
                    id: this.column.id,
                    before: false,
                  });
                  Promise.resolve()
                    .then(() => {
                      const next = this.nextElementSibling?.nextElementSibling;
                      if (next instanceof MobileTableColumnHeader) {
                        next.editTitle();
                        next.scrollIntoView({
                          inline: 'nearest',
                          block: 'nearest',
                        });
                      }
                    })
                    .catch(console.error);
                },
              }),
              menu.action({
                name: 'Move Left',
                prefix: MoveLeftIcon(),
                hide: () => this.column.isFirst,
                select: () => {
                  const preId = this.tableViewManager.propertyPreGet(
                    this.column.id
                  )?.id;
                  if (!preId) {
                    return;
                  }
                  this.tableViewManager.propertyMove(this.column.id, {
                    id: preId,
                    before: true,
                  });
                },
              }),
              menu.action({
                name: 'Move Right',
                prefix: MoveRightIcon(),
                hide: () => this.column.isLast,
                select: () => {
                  const nextId = this.tableViewManager.propertyNextGet(
                    this.column.id
                  )?.id;
                  if (!nextId) {
                    return;
                  }
                  this.tableViewManager.propertyMove(this.column.id, {
                    id: nextId,
                    before: false,
                  });
                },
              }),
            ],
          }),
          menu.group({
            items: [
              menu.action({
                name: 'Duplicate',
                prefix: DuplicateIcon(),
                hide: () =>
                  !this.column.duplicate || this.column.type$.value === 'title',
                select: () => {
                  this.column.duplicate?.();
                },
              }),
              menu.action({
                name: 'Delete',
                prefix: DeleteIcon(),
                hide: () =>
                  !this.column.delete || this.column.type$.value === 'title',
                select: () => {
                  this.column.delete?.();
                },
                class: {
                  'delete-item': true,
                },
              }),
            ],
          }),
        ],
      },
    });
  }

  override render() {
    const column = this.column;
    const style = styleMap({
      height: DEFAULT_COLUMN_TITLE_HEIGHT + 'px',
    });
    return html`
      <div
        style=${style}
        class="mobile-table-column-header"
        @click="${this._clickColumn}"
      >
        <uni-lit
          class="mobile-table-column-header-icon"
          .uni="${column.icon}"
        ></uni-lit>
        <div class="mobile-table-column-header-name">${column.name$.value}</div>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor column!: TableColumn;

  @property({ attribute: false })
  accessor tableViewManager!: TableSingleView;
}

function numberFormatConfig(column: Property): MenuConfig {
  return () =>
    html` <affine-database-number-format-bar
      .column="${column}"
    ></affine-database-number-format-bar>`;
}

declare global {
  interface HTMLElementTagNameMap {
    'mobile-table-column-header': MobileTableColumnHeader;
  }
}
