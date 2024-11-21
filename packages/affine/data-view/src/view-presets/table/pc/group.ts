import {
  menu,
  popFilterableSimpleMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { PlusIcon } from '@blocksuite/icons/lit';
import { effect } from '@preact/signals-core';
import { css, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { DataViewRenderer } from '../../../core/data-view.js';
import type { GroupData } from '../../../core/group-by/trait.js';
import type { TableSingleView } from '../table-view-manager.js';
import type { DataViewTable } from './table-view.js';

import { GroupTitle } from '../../../core/group-by/group-title.js';
import { createDndContext } from '../../../core/utils/wc-dnd/dnd-context.js';
import { defaultActivators } from '../../../core/utils/wc-dnd/sensors/index.js';
import { linearMove } from '../../../core/utils/wc-dnd/utils/linear-move.js';
import { LEFT_TOOL_BAR_WIDTH } from '../consts.js';
import { TableAreaSelection } from '../types.js';
import { DataViewColumnPreview } from './header/column-renderer.js';
import { getVerticalIndicator } from './header/vertical-indicator.js';

const styles = css`
  affine-data-view-table-group:hover .group-header-op {
    visibility: visible;
    opacity: 1;
  }

  .data-view-table-group-add-row {
    display: flex;
    width: 100%;
    height: 28px;
    position: relative;
    z-index: 0;
    cursor: pointer;
    transition: opacity 0.2s ease-in-out;
    padding: 4px 8px;
    border-bottom: 1px solid var(--affine-border-color);
  }

  @media print {
    .data-view-table-group-add-row {
      display: none;
    }
  }

  .data-view-table-group-add-row-button {
    position: sticky;
    left: ${8 + LEFT_TOOL_BAR_WIDTH}px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    user-select: none;
    font-size: 12px;
    line-height: 20px;
    color: var(--affine-text-secondary-color);
  }
`;

export class TableGroup extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  private clickAddRow = () => {
    this.view.rowAdd('end', this.group?.key);
    requestAnimationFrame(() => {
      const selectionController = this.viewEle.selectionController;
      const index = this.view.properties$.value.findIndex(
        v => v.type$.value === 'title'
      );
      selectionController.selection = TableAreaSelection.create({
        groupKey: this.group?.key,
        focus: {
          rowIndex: this.rows.length - 1,
          columnIndex: index,
        },
        isEditing: true,
      });
    });
  };

  private clickAddRowInStart = () => {
    this.view.rowAdd('start', this.group?.key);
    requestAnimationFrame(() => {
      const selectionController = this.viewEle.selectionController;
      const index = this.view.properties$.value.findIndex(
        v => v.type$.value === 'title'
      );
      selectionController.selection = TableAreaSelection.create({
        groupKey: this.group?.key,
        focus: {
          rowIndex: 0,
          columnIndex: index,
        },
        isEditing: true,
      });
    });
  };

  private clickGroupOptions = (e: MouseEvent) => {
    const group = this.group;
    if (!group) {
      return;
    }
    const ele = e.currentTarget as HTMLElement;
    popFilterableSimpleMenu(popupTargetFromElement(ele), [
      menu.action({
        name: 'Ungroup',
        hide: () => group.value == null,
        select: () => {
          group.rows.forEach(id => {
            group.manager.removeFromGroup(id, group.key);
          });
        },
      }),
      menu.action({
        name: 'Delete Cards',
        select: () => {
          this.view.rowDelete(group.rows);
        },
      }),
    ]);
  };

  private renderGroupHeader = () => {
    if (!this.group) {
      return null;
    }
    return html`
      <div
        style="position: sticky;left: 0;width: max-content;padding: 6px 0;margin-bottom: 4px;display:flex;align-items:center;gap: 12px;max-width: 400px"
      >
        ${GroupTitle(this.group, {
          readonly: this.view.readonly$.value,
          clickAdd: this.clickAddRowInStart,
          clickOps: this.clickGroupOptions,
        })}
      </div>
    `;
  };

  @property({ attribute: false })
  accessor group: GroupData | undefined = undefined;

  @property({ attribute: false })
  accessor view!: TableSingleView;

  dndContext = createDndContext({
    activators: defaultActivators,
    container: this,
    modifiers: [
      ({ transform }) => {
        return {
          ...transform,
          y: 0,
        };
      },
    ],
    onDragEnd: ({ over, active }) => {
      if (over && over.id !== active.id) {
        const activeIndex = this.view.properties$.value.findIndex(
          data => data.id === active.id
        );
        const overIndex = this.view.properties$.value.findIndex(
          data => data.id === over.id
        );
        this.view.propertyMove(active.id, {
          before: activeIndex > overIndex,
          id: over.id,
        });
      }
    },
    collisionDetection: linearMove(true),
    createOverlay: active => {
      const column = this.view.propertyGet(active.id);
      const preview = new DataViewColumnPreview();
      preview.column = column;
      preview.group = this.group;
      preview.container = this;
      preview.style.position = 'absolute';
      preview.style.zIndex = '999';
      const scale = this.dndContext.scale$.value;
      const offsetParentRect = this.offsetParent?.getBoundingClientRect();
      if (!offsetParentRect) {
        return;
      }
      preview.style.width = `${column.width$.value}px`;
      preview.style.top = `${(active.rect.top - offsetParentRect.top - 1) / scale.y}px`;
      preview.style.left = `${(active.rect.left - offsetParentRect.left) / scale.x}px`;
      const cells = Array.from(
        this.querySelectorAll(`[data-column-id="${active.id}"]`)
      ) as HTMLElement[];
      cells.forEach(ele => {
        ele.style.opacity = '0.1';
      });
      this.append(preview);
      return {
        overlay: preview,
        cleanup: () => {
          preview.remove();
          cells.forEach(ele => {
            ele.style.opacity = '1';
          });
        },
      };
    },
  });

  showIndicator = () => {
    const columnMoveIndicator = getVerticalIndicator();
    this.disposables.add(
      effect(() => {
        const active = this.dndContext.active$.value;
        const over = this.dndContext.over$.value;
        if (!active || !over) {
          columnMoveIndicator.remove();
          return;
        }
        const scrollX = this.dndContext.scrollOffset$.value.x;
        const bottom =
          this.rowsContainer?.getBoundingClientRect().bottom ??
          this.getBoundingClientRect().bottom;
        const left =
          over.rect.left < active.rect.left ? over.rect.left : over.rect.right;
        const height = bottom - over.rect.top;
        columnMoveIndicator.display(left - scrollX, over.rect.top, height);
      })
    );
  };

  get rows() {
    return this.group?.rows ?? this.view.rows$.value;
  }

  private renderRows(ids: string[]) {
    return html`
      <affine-database-column-header
        .renderGroupHeader="${this.renderGroupHeader}"
        .tableViewManager="${this.view}"
      ></affine-database-column-header>
      <div class="affine-database-block-rows">
        ${repeat(
          ids,
          id => id,
          (id, idx) => {
            return html` <data-view-table-row
              data-row-index="${idx}"
              data-row-id="${id}"
              .dataViewEle="${this.dataViewEle}"
              .view="${this.view}"
              .rowId="${id}"
              .rowIndex="${idx}"
            ></data-view-table-row>`;
          }
        )}
      </div>
      ${this.view.readonly$.value
        ? null
        : html` <div
            class="data-view-table-group-add-row dv-hover"
            @click="${this.clickAddRow}"
          >
            <div
              class="data-view-table-group-add-row-button dv-icon-16"
              data-test-id="affine-database-add-row-button"
              role="button"
            >
              ${PlusIcon()}<span style="font-size: 12px">New Record</span>
            </div>
          </div>`}
      <affine-database-column-stats .view="${this.view}" .group="${this.group}">
      </affine-database-column-stats>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.showIndicator();
  }

  override render() {
    return this.renderRows(this.rows);
  }

  @property({ attribute: false })
  accessor dataViewEle!: DataViewRenderer;

  @query('.affine-database-block-rows')
  accessor rowsContainer: HTMLElement | null = null;

  @property({ attribute: false })
  accessor viewEle!: DataViewTable;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-table-group': TableGroup;
  }
}
