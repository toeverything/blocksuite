import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import { popMenu } from '../../../components/menu/index.js';
import type { UniLit } from '../../../components/uni-component/uni-component.js';
import {
  DatabaseDuplicate,
  DatabaseMoveLeft,
  DatabaseMoveRight,
  DeleteIcon,
  TextIcon,
} from '../../../icons/index.js';
import type { DataViewCellLifeCycle } from '../columns/manager.js';
import type {
  DataViewColumnManager,
  DataViewManager,
} from '../data-view-manager.js';

const styles = css`
  affine-data-view-record-field {
    display: flex;
    gap: 12px;
  }

  .field-left {
    padding: 2px 4px;
    height: 24px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    line-height: 20px;
    color: var(--affine-text-secondary-color);
    width: 102px;
    border-radius: 4px;
    cursor: pointer;
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
    padding: 2px 4px;
    border-radius: 4px;
    flex: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    border: 1px solid transparent;
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
`;

@customElement('affine-data-view-record-field')
export class RecordField extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewManager;
  @property({ attribute: false })
  column!: DataViewColumnManager;
  @property({ attribute: false })
  rowId!: string;
  @state()
  isFocus = false;
  @state()
  editing = false;
  private _cell = createRef<UniLit<DataViewCellLifeCycle>>();

  public get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value?.expose;
  }

  public changeEditing = (editing: boolean) => {
    const selection = this.closest('affine-data-view-record-detail')?.selection;
    if (selection) {
      selection.selection = {
        propertyId: this.column.id,
        isEditing: editing,
      };
    }
  };

  public _click = (e: MouseEvent) => {
    e.stopPropagation();
    this.changeEditing(true);
  };
  public _clickLeft = (e: MouseEvent) => {
    const ele = e.currentTarget as HTMLElement;
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
            name: 'Column type',
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
            name: 'Duplicate column',
            icon: DatabaseDuplicate,
            hide: () => !this.column.duplicate || this.column.type === 'title',
            select: () => {
              this.column.duplicate?.();
            },
          },
          {
            type: 'action',
            name: 'Move up',
            icon: html` <div
              style="transform: rotate(90deg);display:flex;align-items:center;"
            >
              ${DatabaseMoveLeft}
            </div>`,
            hide: () => this.column.isFirst,
            select: () => {
              const preId = this.view.columnGetPreColumn(this.column.id)?.id;
              if (!preId) {
                return;
              }
              this.view.columnMove(this.column.id, {
                id: preId,
                before: true,
              });
            },
          },
          {
            type: 'action',
            name: 'Move down',
            icon: html` <div
              style="transform: rotate(90deg);display:flex;align-items:center;"
            >
              ${DatabaseMoveRight}
            </div>`,
            hide: () => this.column.isLast,
            select: () => {
              const nextId = this.view.columnGetNextColumn(this.column.id)?.id;
              if (!nextId) {
                return;
              }
              this.view.columnMove(this.column.id, {
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

  override render() {
    const column = this.column;

    const props = {
      column: this.column,
      rowId: this.rowId,
      isEditing: this.editing,
      selectCurrentCell: this.changeEditing,
    };
    const { view, edit } = this.column.detailRenderer;
    const contentClass = classMap({
      'field-content': true,
      'is-editing': this.editing,
      'is-focus': this.isFocus,
    });
    return html`
      <div class="field-left" @click="${this._clickLeft}">
        <div class="icon">
          <uni-lit .uni="${this.column.icon}"></uni-lit>
        </div>
        <div class="filed-name">${column.name}</div>
      </div>
      <div @click="${this._click}" class="${contentClass}">
        <uni-lit
          ${ref(this._cell)}
          class="kanban-cell"
          .uni="${this.editing && edit ? edit : view}"
          .props="${props}"
        ></uni-lit>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-record-field': RecordField;
  }
}
