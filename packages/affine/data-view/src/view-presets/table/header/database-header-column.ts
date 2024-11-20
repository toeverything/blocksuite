import {
  menu,
  type MenuConfig,
  popMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
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
import { classMap } from 'lit/directives/class-map.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { Property } from '../../../core/view-manager/property.js';
import type { NumberPropertyDataType } from '../../../property-presets/index.js';
import type { TableColumn, TableSingleView } from '../table-view-manager.js';

import { inputConfig, typeConfig } from '../../../core/common/property-menu.js';
import { renderUniLit } from '../../../core/index.js';
import {
  draggable,
  dragHandler,
  droppable,
} from '../../../core/utils/wc-dnd/dnd-context.js';
import { numberFormats } from '../../../property-presets/number/utils/formats.js';
import { DEFAULT_COLUMN_TITLE_HEIGHT } from '../consts.js';
import {
  getTableGroupRect,
  getVerticalIndicator,
  startDragWidthAdjustmentBar,
} from './vertical-indicator.js';

export class DatabaseHeaderColumn extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    affine-database-header-column {
      display: flex;
    }

    .affine-database-header-column-grabbing * {
      cursor: grabbing;
    }
  `;

  private _clickColumn = () => {
    if (this.tableViewManager.readonly$.value) {
      return;
    }
    this.popMenu();
  };

  private _clickTypeIcon = (event: MouseEvent) => {
    if (this.tableViewManager.readonly$.value) {
      return;
    }
    if (this.column.type$.value === 'title') {
      return;
    }
    event.stopPropagation();
    popMenu(popupTargetFromElement(this), {
      options: {
        items: this.tableViewManager.propertyMetas.map(config => {
          return menu.action({
            name: config.config.name,
            isSelected: config.type === this.column.type$.value,
            prefix: renderUniLit(
              this.tableViewManager.propertyIconGet(config.type)
            ),
            select: () => {
              this.column.typeSet?.(config.type);
            },
          });
        }),
      },
    });
  };

  private _contextMenu = (e: MouseEvent) => {
    if (this.tableViewManager.readonly$.value) {
      return;
    }
    e.preventDefault();
    this.popMenu(e.currentTarget as HTMLElement);
  };

  private _enterWidthDragBar = () => {
    if (this.tableViewManager.readonly$.value) {
      return;
    }
    if (this.drawWidthDragBarTask) {
      cancelAnimationFrame(this.drawWidthDragBarTask);
      this.drawWidthDragBarTask = 0;
    }
    this.drawWidthDragBar();
  };

  private _leaveWidthDragBar = () => {
    cancelAnimationFrame(this.drawWidthDragBarTask);
    this.drawWidthDragBarTask = 0;
    getVerticalIndicator().remove();
  };

  private drawWidthDragBar = () => {
    const rect = getTableGroupRect(this);
    if (!rect) {
      return;
    }
    getVerticalIndicator().display(
      this.getBoundingClientRect().right,
      rect.top,
      rect.bottom - rect.top
    );
    this.drawWidthDragBarTask = requestAnimationFrame(this.drawWidthDragBar);
  };

  private drawWidthDragBarTask = 0;

  private widthDragBar = createRef();

  editTitle = () => {
    this._clickColumn();
  };

  private get readonly() {
    return this.tableViewManager.readonly$.value;
  }

  private popMenu(ele?: HTMLElement) {
    const enableNumberFormatting =
      this.tableViewManager.featureFlags$.value.enable_number_formatting;

    popMenu(popupTargetFromElement(ele ?? this), {
      options: {
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
                      if (pre instanceof DatabaseHeaderColumn) {
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
                      if (next instanceof DatabaseHeaderColumn) {
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

  private widthDragStart(event: PointerEvent) {
    startDragWidthAdjustmentBar(
      event,
      this,
      this.getBoundingClientRect().width,
      this.column
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    const table = this.closest('affine-database-table');
    if (table) {
      this.disposables.add(
        table.props.handleEvent('dragStart', context => {
          if (this.tableViewManager.readonly$.value) {
            return;
          }
          const event = context.get('pointerState').raw;
          const target = event.target;
          if (target instanceof Element) {
            if (this.widthDragBar.value?.contains(target)) {
              event.preventDefault();
              event.stopPropagation();
              this.widthDragStart(event);
              return true;
            }
          }
          return false;
        })
      );
    }
  }

  override render() {
    const column = this.column;
    const style = styleMap({
      height: DEFAULT_COLUMN_TITLE_HEIGHT + 'px',
    });
    const classes = classMap({
      'affine-database-column-move': true,
      [this.grabStatus]: true,
    });
    return html`
      <div
        style=${style}
        class="affine-database-column-content"
        @click="${this._clickColumn}"
        @contextmenu="${this._contextMenu}"
        ${dragHandler(column.id)}
        ${draggable(column.id)}
        ${droppable(column.id)}
      >
        ${this.readonly
          ? null
          : html` <button class="${classes}">
              <div class="hover-trigger"></div>
              <div class="control-h"></div>
              <div class="control-l"></div>
              <div class="control-r"></div>
            </button>`}
        <div class="affine-database-column-text ${column.type$.value}">
          <div
            class="affine-database-column-type-icon dv-hover"
            @click="${this._clickTypeIcon}"
          >
            <uni-lit .uni="${column.icon}"></uni-lit>
          </div>
          <div class="affine-database-column-text-content">
            <div class="affine-database-column-text-input">
              ${column.name$.value}
            </div>
          </div>
        </div>
      </div>
      <div
        ${ref(this.widthDragBar)}
        @mouseenter="${this._enterWidthDragBar}"
        @mouseleave="${this._leaveWidthDragBar}"
        style="width: 0;position: relative;height: 100%;z-index: 1;cursor: col-resize"
      >
        <div style="width: 8px;height: 100%;margin-left: -4px;"></div>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor column!: TableColumn;

  @property({ attribute: false })
  accessor grabStatus: 'grabStart' | 'grabEnd' | 'grabbing' = 'grabEnd';

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
    'affine-database-header-column': DatabaseHeaderColumn;
  }
}
