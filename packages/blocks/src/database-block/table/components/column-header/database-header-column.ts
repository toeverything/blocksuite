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
import { resolveInsertPosition } from '../../../database-model.js';
import { onClickOutside } from '../../../utils.js';
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

  private _columnsOffset = (header: Element) => {
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
    return {
      getInsertPosition,
      offsetArr,
      columnsArr: columnsArr.map(v => ({ id: v.column.id })),
    };
  };
  private _drag = (evt: MouseEvent) => {
    const header = this.closest('.affine-database-table-container');
    const container = header?.parentElement;
    assertExists(header);
    assertExists(container);
    const { getInsertPosition, offsetArr, columnsArr } =
      this._columnsOffset(header);
    const rect = this.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const offsetLeft = evt.x - rect.left;
    const offsetRight = rect.right - evt.x;
    const startLeft = rect.left - headerRect.left;
    const max = headerRect.width - rect.width;
    const dragPreview = createDragPreview(
      rect.width,
      headerRect.height,
      startLeft
    );
    const dropPreview = createDropPreview(headerRect.height);
    dragPreview.load(header);
    dropPreview.load(header);
    let checkScroll = 0;
    let currentMouseX = evt.x;
    let currentInsertPosition: InsertPosition | undefined = undefined;
    let preTime = 0;
    const scrollProcess = (time: number) => {
      const delta = (time - preTime) * 0.4;
      if (currentMouseX < containerRect.left + offsetLeft) {
        container.scrollLeft -= delta;
        move({ x: currentMouseX });
      } else if (currentMouseX > containerRect.right - offsetRight) {
        container.scrollLeft += delta;
        move({ x: currentMouseX });
      }
      preTime = time;
      checkScroll = requestAnimationFrame(scrollProcess);
    };
    scrollProcess(0);
    const move = (evt: { x: number }) => {
      currentMouseX = evt.x;
      const currentOffset = Math.max(
        0,
        Math.min(
          max,
          currentMouseX - header.getBoundingClientRect().left - offsetLeft
        )
      );
      currentInsertPosition = getInsertPosition(currentOffset, rect.width);
      if (currentInsertPosition) {
        const index = resolveInsertPosition(currentInsertPosition, columnsArr);
        const offset = offsetArr[index];
        dropPreview.display(offset);
      } else {
        dropPreview.hide();
      }
      dragPreview.display(currentOffset);
    };
    const up = () => {
      try {
        this.tableViewManager.moveColumn(this.column.id, currentInsertPosition);
      } finally {
        document.body.removeEventListener('mousemove', move);
        document.body.removeEventListener('mouseup', up);
        cancelAnimationFrame(checkScroll);
        dropPreview.remove();
        dragPreview.remove();
      }
    };
    document.body.addEventListener('mousemove', move);
    document.body.addEventListener('mouseup', up);
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
  return {
    display(offset: number) {
      div.style.left = `${Math.round(offset)}px`;
    },
    remove() {
      div.remove();
    },
    load(ele: Element) {
      ele.append(div);
    },
  };
};

const createDropPreview = (height: number) => {
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
    load(ele: Element) {
      ele.append(div);
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
