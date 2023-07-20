import {
  DatabaseDragIcon,
  DatabaseDuplicate,
  DatabaseInsertLeft,
  DatabaseInsertRight,
  DatabaseMoveLeft,
  DatabaseMoveRight,
  DatabaseMultiSelect,
  DatabaseNumber,
  DatabaseProgress,
  DatabaseSelect,
  DeleteIcon,
  LinkIcon,
  TextIcon,
  TodoIcon,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { popMenu } from '../../../../components/menu/menu.js';
import type { InsertPosition } from '../../../types.js';
import { startDrag } from '../../../utils/drag.js';
import { startFrameLoop } from '../../../utils/frame-loop.js';
import { insertPositionToIndex } from '../../../utils/insert.js';
import { getResultInRange } from '../../../utils/utils.js';
import { DEFAULT_COLUMN_TITLE_HEIGHT } from '../../consts.js';
import { getTableContainer } from '../../table-view.js';
import type { DataViewTableColumnManager } from '../../table-view-manager.js';
import type { DataViewTableManager } from '../../table-view-manager.js';
import type { ColumnHeader, ColumnTypeIcon } from '../../types.js';
import { DataViewColumnPreview } from './column-renderer.js';

@customElement('affine-database-header-column')
export class DatabaseHeaderColumn extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .affine-database-header-column-grabbing * {
      cursor: grabbing;
    }
  `;
  @property({ attribute: false })
  tableViewManager!: DataViewTableManager;

  @property({ attribute: false })
  column!: DataViewTableColumnManager;

  override firstUpdated() {
    this._disposables.add(
      this.tableViewManager.slots.update.on(() => {
        this.requestUpdate();
      })
    );
  }

  private _columnsOffset = (header: Element, scale: number) => {
    const columns = header.querySelectorAll('affine-database-header-column');
    const left: ColumnOffset[] = [];
    const right: ColumnOffset[] = [];
    let curr = left;
    const offsetArr: number[] = [];
    const columnsArr = Array.from(columns);
    for (let i = 0; i < columnsArr.length; i++) {
      const v = columnsArr[i];
      if (v === this) {
        curr = right;
        offsetArr.push(-1);
        continue;
      }
      curr.push({
        x: v.offsetLeft + v.offsetWidth / 2,
        ele: v,
      });
      offsetArr.push(v.offsetLeft);
      if (i === columnsArr.length - 1) {
        offsetArr.push(v.offsetLeft + v.offsetWidth);
      }
    }
    left.reverse();
    const getInsertPosition = (offset: number, width: number) => {
      let result: InsertPosition | undefined = undefined;
      for (let i = 0; i < left.length; i++) {
        const { x, ele } = left[i];
        if (x < offset) {
          if (result) {
            return result;
          }
          break;
        } else {
          result = {
            before: true,
            id: ele.column.id,
          };
        }
      }
      const offsetRight = offset + width;
      for (const { x, ele } of right) {
        if (x > offsetRight) {
          if (result) {
            return result;
          }
          break;
        } else {
          result = {
            before: false,
            id: ele.column.id,
          };
        }
      }
      return result;
    };
    const fixedColumns = columnsArr.map(v => ({ id: v.column.id }));
    const getInsertOffset = (insertPosition: InsertPosition) => {
      return offsetArr[insertPositionToIndex(insertPosition, fixedColumns)];
    };
    return {
      computeInsertInfo: (offset: number, width: number) => {
        const insertPosition = getInsertPosition(offset, width);
        return {
          insertPosition: insertPosition,
          insertOffset: insertPosition
            ? getInsertOffset(insertPosition)
            : undefined,
        };
      },
    };
  };
  private _drag = (evt: MouseEvent) => {
    const tableContainer = getTableContainer(this);
    const scrollContainer = tableContainer?.parentElement;
    assertExists(tableContainer);
    assertExists(scrollContainer);
    const columnHeaderRect = this.getBoundingClientRect();
    const scale = columnHeaderRect.width / this.column.width;
    const tableContainerRect = scrollContainer.getBoundingClientRect();
    const headerContainerRect = tableContainer.getBoundingClientRect();

    const rectOffsetLeft = evt.x - columnHeaderRect.left;
    const offsetRight = columnHeaderRect.right - evt.x;

    const startOffset =
      (columnHeaderRect.left - headerContainerRect.left) / scale;
    const max = (headerContainerRect.width - columnHeaderRect.width) / scale;

    const { computeInsertInfo } = this._columnsOffset(tableContainer, scale);
    const column = new DataViewColumnPreview();
    column.tableViewManager = this.tableViewManager;
    column.column = this.column;
    column.table = tableContainer;
    const dragPreview = createDragPreview(
      tableContainer,
      columnHeaderRect.width / scale,
      headerContainerRect.height / scale,
      startOffset,
      column
    );
    const dropPreview = createDropPreview(
      tableContainer,
      headerContainerRect.height
    );

    const cancelScroll = startFrameLoop(delta => {
      const offset = delta * 0.4;
      if (drag.data.x < tableContainerRect.left + rectOffsetLeft) {
        scrollContainer.scrollLeft -= offset;
        drag.move({ x: drag.data.x });
      } else if (drag.data.x > tableContainerRect.right - offsetRight) {
        scrollContainer.scrollLeft += offset;
        drag.move({ x: drag.data.x });
      }
    });
    const html = document.querySelector('html');
    html?.classList.toggle('affine-database-header-column-grabbing', true);
    const drag = startDrag<{
      x: number;
      insertPosition?: InsertPosition;
    }>(evt, {
      onDrag: evt => ({
        x: evt.x,
      }),
      onMove: ({ x }: { x: number }) => {
        const currentOffset = getResultInRange(
          (x - tableContainer.getBoundingClientRect().left - rectOffsetLeft) /
            scale,
          0,
          max
        );
        const insertInfo = computeInsertInfo(
          currentOffset,
          columnHeaderRect.width / scale
        );
        if (insertInfo.insertOffset != null) {
          dropPreview.display(insertInfo.insertOffset);
        } else {
          dropPreview.hide();
        }
        dragPreview.display(currentOffset);
        return {
          x,
          insertPosition: insertInfo.insertPosition,
        };
      },
      onDrop: ({ insertPosition }) => {
        if (insertPosition) {
          this.tableViewManager.columnMove(this.column.id, insertPosition);
        }
        cancelScroll();
        html?.classList.toggle('affine-database-header-column-grabbing', false);
        dropPreview.remove();
        dragPreview.remove();
      },
    });
  };

  private get readonly() {
    return this.tableViewManager.readonly;
  }

  editTitle = () => {
    this._clickColumn();
  };

  private _clickColumn = () => {
    popMenu(this, {
      options: {
        input: {
          initValue: this.column.name,
          onComplete: text => {
            this.column.updateName(text);
          },
        },
        items: [
          {
            type: 'sub-menu',
            name: 'Column type',
            icon: TextIcon,
            hide: () => !this.column.updateType || this.column.type === 'title',
            options: {
              input: {
                search: true,
              },
              items: columnTypes.map(type => {
                return {
                  type: 'action',
                  name: type.text,
                  icon: type.icon,
                  select: () => {
                    this.column.updateType?.(type.type);
                  },
                };
              }),
            },
          },
          {
            type: 'action',
            name: 'Duplicate column',
            icon: DatabaseDuplicate,
            hide: () => !this.column.duplicate || this.column.type === 'title',
            select: () => {
              this.column.duplicate?.();
              Promise.resolve().then(() => {
                const next = this.nextElementSibling;
                if (next instanceof DatabaseHeaderColumn) {
                  next.editTitle();
                  next.scrollIntoView();
                }
              });
            },
          },
          {
            type: 'action',
            name: 'Insert left column',
            icon: DatabaseInsertLeft,
            select: () => {
              this.tableViewManager.columnAdd({
                id: this.column.id,
                before: true,
              });
              Promise.resolve().then(() => {
                const pre = this.previousElementSibling;
                if (pre instanceof DatabaseHeaderColumn) {
                  pre.editTitle();
                  pre.scrollIntoView();
                }
              });
            },
          },
          {
            type: 'action',
            name: 'Insert right column',
            icon: DatabaseInsertRight,
            select: () => {
              this.tableViewManager.columnAdd({
                id: this.column.id,
                before: false,
              });
              Promise.resolve().then(() => {
                const next = this.nextElementSibling;
                if (next instanceof DatabaseHeaderColumn) {
                  next.editTitle();
                  next.scrollIntoView();
                }
              });
            },
          },
          {
            type: 'action',
            name: 'Move left',
            icon: DatabaseMoveLeft,
            hide: () => this.column.isFirst,
            select: () => {
              const preId = this.tableViewManager.columnGetPreColumn(
                this.column.id
              )?.id;
              if (!preId) {
                return;
              }
              this.tableViewManager.columnMove(this.column.id, {
                id: preId,
                before: true,
              });
            },
          },
          {
            type: 'action',
            name: 'Move Right',
            icon: DatabaseMoveRight,
            hide: () => this.column.isLast,
            select: () => {
              const nextId = this.tableViewManager.columnGetNextColumn(
                this.column.id
              )?.id;
              if (!nextId) {
                return;
              }
              this.tableViewManager.columnMove(this.column.id, {
                id: nextId,
                before: false,
              });
            },
          },
          {
            type: 'group',
            name: 'operation',
            children: () => [
              {
                type: 'action',
                name: 'Delete column',
                icon: DeleteIcon,
                hide: () => !this.column.delete || this.column.type === 'title',
                select: () => {
                  this.column.delete?.();
                },
                class: 'delete-item',
              },
            ],
          },
        ],
      },
    });
  };

  private _clickTypeIcon = (event: MouseEvent) => {
    event.stopPropagation();
    popMenu(this, {
      options: {
        input: {
          search: true,
          placeholder: 'Search',
        },
        items: columnTypes.map(type => {
          return {
            type: 'action',
            name: type.text,
            icon: type.icon,
            select: () => {
              this.column.updateType?.(type.type);
            },
          };
        }),
      },
    });
  };

  override render() {
    const column = this.column;
    const style = styleMap({
      height: DEFAULT_COLUMN_TITLE_HEIGHT + 'px',
    });
    return html`
      <div
        style=${style}
        class="affine-database-column-content"
        @click="${this._clickColumn}"
      >
        <div class="affine-database-column-text ${column.type}">
          <div
            class="affine-database-column-type-icon"
            @click="${this._clickTypeIcon}"
          >
            ${columnTypeIconMap[column.type]}
          </div>
          <div class="affine-database-column-text-content">
            <div class="affine-database-column-text-input">${column.name}</div>
          </div>
        </div>
        ${this.readonly
          ? null
          : html` <div
              class="affine-database-column-move"
              @mousedown="${this._drag}"
            >
              ${DatabaseDragIcon}
            </div>`}
      </div>
    `;
  }
}

type ColumnOffset = {
  x: number;
  ele: DatabaseHeaderColumn;
};

const createDragPreview = (
  container: Element,
  width: number,
  height: number,
  startLeft: number,
  content: HTMLElement
) => {
  const div = document.createElement('div');
  div.append(content);
  // div.style.pointerEvents='none';
  div.style.position = 'absolute';
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
  div.style.left = `${startLeft}px`;
  div.style.top = `0px`;
  div.style.zIndex = '9';
  container.append(div);
  return {
    display(offset: number) {
      div.style.left = `${Math.round(offset)}px`;
    },
    remove() {
      div.remove();
    },
  };
};

const createDropPreview = (container: Element, height: number) => {
  const width = 4;
  const div = document.createElement('div');
  // div.style.pointerEvents='none';
  div.className = 'database-move-column-drop-preview';
  div.style.position = 'absolute';
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
  div.style.display = 'none';
  div.style.top = `0px`;
  div.style.zIndex = '9';
  div.style.backgroundColor = 'blue';
  container.append(div);
  return {
    display(offset: number) {
      div.style.display = 'block';
      div.style.left = `${offset - width / 2}px`;
    },
    hide() {
      div.style.display = 'none';
    },
    remove() {
      div.remove();
    },
  };
};

const columnTypeIconMap: ColumnTypeIcon = {
  select: DatabaseSelect,
  number: DatabaseNumber,
  checkbox: TodoIcon,
  progress: DatabaseProgress,
  'rich-text': TextIcon,
  'multi-select': DatabaseMultiSelect,
  link: LinkIcon,
};

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-header-column': DatabaseHeaderColumn;
  }
}
const columnTypes: ColumnHeader[] = [
  {
    type: 'rich-text',
    text: 'Text',
    icon: TextIcon,
  },
  {
    type: 'select',
    text: 'Select',
    icon: DatabaseSelect,
  },
  {
    type: 'multi-select',
    text: 'Multi-select',
    icon: DatabaseMultiSelect,
  },
  {
    type: 'number',
    text: 'Number',
    icon: DatabaseNumber,
  },
  {
    type: 'checkbox',
    text: 'Checkbox',
    icon: TodoIcon,
  },
  {
    type: 'progress',
    text: 'Progress',
    icon: DatabaseProgress,
  },
  {
    type: 'link',
    text: 'Link',
    icon: LinkIcon,
  },
];
