import {
  DatabaseDone,
  DatabaseDragIcon,
  DatabaseMultiSelect,
  DatabaseNumber,
  DatabaseProgress,
  DatabaseSelect,
  PenIcon,
  TextIcon,
  TodoIcon,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { computePosition } from '@floating-ui/dom';
import { customElement, property, query, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { InsertPosition } from '../../../database-model.js';
import { insertPositionToIndex } from '../../../database-model.js';
import { startDrag } from '../../../utils/drag.js';
import { startFrameLoop } from '../../../utils/frame-loop.js';
import { getResultInRange, onClickOutside } from '../../../utils/utils.js';
import { getTableContainer } from '../../table-view.js';
import type {
  ColumnManager,
  TableViewManager,
} from '../../table-view-manager.js';
import type { ColumnTypeIcon } from '../../types.js';
import { ColumnTypePopup } from '../edit-column-popup/column-type-popup.js';
import { EditColumnPopup } from '../edit-column-popup/edit-column-popup.js';

@customElement('affine-database-header-column')
export class DatabaseHeaderColumn extends WithDisposable(ShadowlessElement) {
  @property()
  tableViewManager!: TableViewManager;

  @property()
  column!: ColumnManager;

  @query('.affine-database-column-input')
  private input!: HTMLInputElement;

  private _clickPen = (e: Event) => {
    e.stopPropagation();
    this.editTitle();
  };

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
      const parent = v.parentElement;
      assertExists(parent);
      curr.push({ x: parent.offsetLeft + parent.offsetWidth / 2, ele: v });
      offsetArr.push(parent.offsetLeft);
      if (i === columnsArr.length - 1) {
        offsetArr.push(parent.offsetLeft + parent.offsetWidth);
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
          result = { before: true, id: ele.column.id };
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
          result = ele.column.id;
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

    const dragPreview = createDragPreview(
      tableContainer,
      columnHeaderRect.width / scale,
      headerContainerRect.height / scale,
      startOffset
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
    const drag = startDrag<{ x: number; insertPosition?: InsertPosition }>(
      evt,
      {
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
            this.tableViewManager.moveColumn(this.column.id, insertPosition);
          }
          cancelScroll();
          dropPreview.remove();
          dragPreview.remove();
        },
      }
    );
  };

  override firstUpdated() {
    this._disposables.add({
      dispose: onClickOutside(
        this,
        () => {
          if (this.isEditing) {
            this._saveColumnTitle();
          }
        },
        'mousedown',
        true
      ),
    });
  }

  private get readonly() {
    return this.tableViewManager.readonly;
  }

  editTitle = () => {
    this.isEditing = true;
    setTimeout(() => {
      this.input.focus();
      this.input.setSelectionRange(0, this.input.value.length);
    });
  };

  private _clickColumn = (event: MouseEvent) => {
    if (this.isEditing) {
      return;
    }
    const currentEl = event.target as Element;
    const reference = currentEl.closest('.affine-database-column');
    assertExists(reference);

    const editColumn = new EditColumnPopup();
    editColumn.tableViewManager = this.tableViewManager;
    editColumn.column = this.column;
    editColumn.editTitle = this.editTitle;

    currentEl.closest('affine-database')?.append(editColumn);
    computePosition(reference, editColumn, {
      placement: 'bottom-start',
    }).then(({ x, y }) => {
      Object.assign(editColumn.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
    onClickOutside(
      editColumn,
      (ele, target) => {
        ele.remove();
      },
      'mousedown'
    );
  };

  private _clickTypeIcon = (event: MouseEvent) => {
    event.stopPropagation();
    const column = this.column;

    const popup = new ColumnTypePopup();
    popup.columnType = column.type;
    popup.select = type => {
      column.updateType?.(type);
      popup.remove();
    };
    document.body.appendChild(popup);

    const target = event.target as HTMLElement;
    const reference = target.closest('.affine-database-column-content');
    assertExists(reference);

    computePosition(reference, popup, {
      placement: 'bottom-start',
    }).then(({ x, y }) => {
      Object.assign(popup.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
    onClickOutside(
      popup,
      (ele, target) => {
        ele.remove();
      },
      'mousedown'
    );
  };

  private _onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      this._saveColumnTitle();
      return;
    }
    if (event.key === 'Escape') {
      this.isEditing = false;
      this.input.blur();
      return;
    }
  };

  private _saveColumnTitle = () => {
    const name = this.input.value;
    this.column?.updateName(name);
    this.isEditing = false;
  };
  private _clickDone = (e: Event) => {
    e.stopPropagation();
    this._saveColumnTitle();
  };

  @state()
  isEditing = false;

  override render() {
    const column = this.column;
    const isEditing = this.isEditing;
    return html`
      <div
        class="affine-database-column-content ${isEditing ? 'edit' : ''}"
        data-column-id="${column.id}"
        @click="${this._clickColumn}"
      >
        <div class="affine-database-column-text ${column.type}">
          <div
            class="affine-database-column-type-icon ${isEditing ? 'edit' : ''}"
            @click="${this._clickTypeIcon}"
          >
            ${columnTypeIconMap[column.type]}
          </div>
          ${isEditing
            ? html` <div class="affine-database-column-text-content">
                <input
                  class="affine-database-column-input"
                  value="${column.name}"
                  @keydown="${this._onKeydown}"
                  @pointerdown="${(event: PointerEvent) =>
                    event.stopPropagation()}"
                />
                <div
                  class="affine-database-column-text-save-icon"
                  @click="${this._clickDone}"
                >
                  ${DatabaseDone}
                </div>
              </div>`
            : html` <div class="affine-database-column-text-content">
                <div class="affine-database-column-text-input">
                  ${column.name}
                </div>
                ${this.readonly
                  ? null
                  : html` <div
                      @click="${this._clickPen}"
                      class="affine-database-column-text-icon"
                    >
                      ${PenIcon}
                    </div>`}
              </div>`}
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

type ColumnOffset = { x: number; ele: DatabaseHeaderColumn };

const createDragPreview = (
  container: Element,
  width: number,
  height: number,
  startLeft: number
) => {
  const div = document.createElement('div');
  // div.style.pointerEvents='none';
  div.style.position = 'absolute';
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
  div.style.left = `${startLeft}px`;
  div.style.top = `0px`;
  div.style.zIndex = '9';
  div.style.backgroundColor = 'rgba(0,0,0,0.3)';
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
};

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-header-column': DatabaseHeaderColumn;
  }
}
