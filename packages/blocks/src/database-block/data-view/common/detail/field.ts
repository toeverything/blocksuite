import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { createRef } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import { popMenu } from '../../../../_common/components/index.js';
import type {
  CellRenderProps,
  DataViewCellLifeCycle,
} from '../../column/index.js';
import { renderUniLit } from '../../utils/uni-component/uni-component.js';
import type {
  DataViewColumnManager,
  DataViewManager,
} from '../../view/data-view-manager.js';
import {
  DatabaseDuplicate,
  DatabaseMoveLeft,
  DatabaseMoveRight,
  DeleteIcon,
  TextIcon,
} from '../icons/index.js';

@customElement('affine-data-view-record-field')
export class RecordField extends WithDisposable(ShadowlessElement) {
  private get readonly() {
    return this.view.readonly;
  }

  get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

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

  @property({ attribute: false })
  accessor view!: DataViewManager;

  @property({ attribute: false })
  accessor column!: DataViewColumnManager;

  @property({ attribute: false })
  accessor rowId!: string;

  @state()
  accessor isFocus = false;

  @state()
  accessor editing = false;

  changeEditing = (editing: boolean) => {
    const selection = this.closest('affine-data-view-record-detail')?.selection;
    if (selection) {
      selection.selection = {
        propertyId: this.column.id,
        isEditing: editing,
      };
    }
  };

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
        input: {
          initValue: this.column.name,
          onComplete: text => {
            this.column.updateName(text);
          },
        },
        items: [
          {
            type: 'sub-menu',
            name: 'Column Type',
            icon: TextIcon,
            hide: () => !this.column.updateType || this.column.type === 'title',
            options: {
              input: {
                search: true,
              },
              items: this.view.allColumnConfig
                .filter(v => v.type !== this.column.type)
                .map(config => {
                  return {
                    type: 'action',
                    name: config.name,
                    icon: html` <uni-lit
                      .uni="${this.view.getIcon(config.type)}"
                    ></uni-lit>`,
                    select: () => {
                      this.column.updateType?.(config.type);
                    },
                  };
                }),
            },
          },
          {
            type: 'action',
            name: 'Duplicate Column',
            icon: DatabaseDuplicate,
            hide: () => !this.column.duplicate || this.column.type === 'title',
            select: () => {
              this.column.duplicate?.();
            },
          },
          {
            type: 'action',
            name: 'Move Up',
            icon: html` <div
              style="transform: rotate(90deg);display:flex;align-items:center;"
            >
              ${DatabaseMoveLeft}
            </div>`,
            hide: () => columns.findIndex(v => v === this.column.id) === 0,
            select: () => {
              const index = columns.findIndex(v => v === this.column.id);
              const targetId = columns[index - 1];
              if (!targetId) {
                return;
              }
              this.view.columnMove(this.column.id, {
                id: targetId,
                before: true,
              });
            },
          },
          {
            type: 'action',
            name: 'Move Down',
            icon: html` <div
              style="transform: rotate(90deg);display:flex;align-items:center;"
            >
              ${DatabaseMoveRight}
            </div>`,
            hide: () =>
              columns.findIndex(v => v === this.column.id) ===
              columns.length - 1,
            select: () => {
              const index = columns.findIndex(v => v === this.column.id);
              const targetId = columns[index + 1];
              if (!targetId) {
                return;
              }
              this.view.columnMove(this.column.id, {
                id: targetId,
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
                name: 'Delete Column',
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

  override render() {
    const column = this.column;

    const props: CellRenderProps = {
      view: this.view,
      column: this.column,
      rowId: this.rowId,
      isEditing: this.editing,
      selectCurrentCell: this.changeEditing,
    };
    const { view, edit } = this.column.renderer;
    const contentClass = classMap({
      'field-content': true,
      empty: !this.editing && this.column.isEmpty(this.rowId),
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
          ref: this._cell,
          class: 'kanban-cell',
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-record-field': RecordField;
  }
}
