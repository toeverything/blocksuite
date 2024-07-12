import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { createRef } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import type {
  CellRenderProps,
  DataViewCellLifeCycle,
} from '../../column/index.js';
import type {
  DataViewColumnManager,
  DataViewManager,
} from '../../view/data-view-manager.js';

import { popMenu } from '../../../../_common/components/index.js';
import { renderUniLit } from '../../utils/uni-component/uni-component.js';
import { inputConfig, typeConfig } from '../column-menu.js';
import {
  DatabaseDuplicate,
  DatabaseMoveLeft,
  DatabaseMoveRight,
  DeleteIcon,
} from '../icons/index.js';

@customElement('affine-data-view-record-field')
export class RecordField extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-data-view-record-field {
      display: flex;
      gap: 12px;
    }

    .field-left {
      padding: 6px;
      display: flex;
      height: max-content;
      align-items: center;
      gap: 6px;
      font-size: var(--data-view-cell-text-size);
      line-height: var(--data-view-cell-text-line-height);
      color: var(--affine-text-secondary-color);
      width: 160px;
      border-radius: 4px;
      cursor: pointer;
      user-select: none;
    }

    .field-left:hover {
      background-color: var(--affine-hover-color);
    }

    affine-data-view-record-field .icon {
      display: flex;
      align-items: center;
      width: 16px;
      height: 16px;
    }

    affine-data-view-record-field .icon svg {
      width: 16px;
      height: 16px;
      fill: var(--affine-icon-color);
    }

    .filed-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .field-content {
      padding: 6px 8px;
      border-radius: 4px;
      flex: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      border: 1px solid transparent;
    }

    .field-content .affine-database-number {
      text-align: left;
      justify-content: start;
    }

    .field-content:hover {
      background-color: var(--affine-hover-color);
    }

    .field-content.is-editing {
      box-shadow: 0px 0px 0px 2px rgba(30, 150, 235, 0.3);
    }

    .field-content.is-focus {
      border: 1px solid var(--affine-primary-color);
    }
    .field-content.empty::before {
      content: 'Empty';
      color: var(--affine-text-disable-color);
      font-size: 14px;
      line-height: 22px;
    }
  `;

  private _cell = createRef<DataViewCellLifeCycle>();

  _click = (e: MouseEvent) => {
    e.stopPropagation();
    if (this.readonly) return;

    this.changeEditing(true);
  };

  _clickLeft = (e: MouseEvent) => {
    if (this.readonly) return;
    const ele = e.currentTarget as HTMLElement;
    const columns = this.view.detailColumns;
    popMenu(ele, {
      options: {
        input: inputConfig(this.column),
        items: [
          typeConfig(this.column, this.view),
          {
            hide: () => !this.column.duplicate || this.column.type === 'title',
            icon: DatabaseDuplicate,
            name: 'Duplicate Column',
            select: () => {
              this.column.duplicate?.();
            },
            type: 'action',
          },
          {
            hide: () => columns.findIndex(v => v === this.column.id) === 0,
            icon: html` <div
              style="transform: rotate(90deg);display:flex;align-items:center;"
            >
              ${DatabaseMoveLeft}
            </div>`,
            name: 'Move Up',
            select: () => {
              const index = columns.findIndex(v => v === this.column.id);
              const targetId = columns[index - 1];
              if (!targetId) {
                return;
              }
              this.view.columnMove(this.column.id, {
                before: true,
                id: targetId,
              });
            },
            type: 'action',
          },
          {
            hide: () =>
              columns.findIndex(v => v === this.column.id) ===
              columns.length - 1,
            icon: html` <div
              style="transform: rotate(90deg);display:flex;align-items:center;"
            >
              ${DatabaseMoveRight}
            </div>`,
            name: 'Move Down',
            select: () => {
              const index = columns.findIndex(v => v === this.column.id);
              const targetId = columns[index + 1];
              if (!targetId) {
                return;
              }
              this.view.columnMove(this.column.id, {
                before: false,
                id: targetId,
              });
            },
            type: 'action',
          },
          {
            children: () => [
              {
                class: 'delete-item',
                hide: () => !this.column.delete || this.column.type === 'title',
                icon: DeleteIcon,
                name: 'Delete Column',
                select: () => {
                  this.column.delete?.();
                },
                type: 'action',
              },
            ],
            name: 'operation',
            type: 'group',
          },
        ],
      },
    });
  };

  changeEditing = (editing: boolean) => {
    const selection = this.closest('affine-data-view-record-detail')?.selection;
    if (selection) {
      selection.selection = {
        isEditing: editing,
        propertyId: this.column.id,
      };
    }
  };

  private get readonly() {
    return this.view.readonly;
  }

  override render() {
    const column = this.column;

    const props: CellRenderProps = {
      column: this.column,
      isEditing: this.editing,
      rowId: this.rowId,
      selectCurrentCell: this.changeEditing,
      view: this.view,
    };
    const { edit, view } = this.column.renderer;
    const contentClass = classMap({
      empty: !this.editing && this.column.isEmpty(this.rowId),
      'field-content': true,
      'is-editing': this.editing,
      'is-focus': this.isFocus,
    });
    return html`
      <div>
        <div class="field-left" @click="${this._clickLeft}">
          <div class="icon">
            <uni-lit .uni="${this.column.icon}"></uni-lit>
          </div>
          <div class="filed-name">${column.name}</div>
        </div>
      </div>
      <div @click="${this._click}" class="${contentClass}">
        ${renderUniLit(this.editing && edit ? edit : view, props, {
          class: 'kanban-cell',
          ref: this._cell,
        })}
      </div>
    `;
  }

  get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

  @property({ attribute: false })
  accessor column!: DataViewColumnManager;

  @state()
  accessor editing = false;

  @state()
  accessor isFocus = false;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor view!: DataViewManager;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-record-field': RecordField;
  }
}
