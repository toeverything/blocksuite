import { popMenu } from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import {
  DeleteIcon,
  DuplicateIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '@blocksuite/icons/lit';
import { computed } from '@preact/signals-core';
import { css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { createRef } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import type {
  CellRenderProps,
  DataViewCellLifeCycle,
} from '../../property/index.js';
import type { Property } from '../../view-manager/property.js';
import type { SingleView } from '../../view-manager/single-view.js';

import { renderUniLit } from '../../utils/uni-component/uni-component.js';
import { inputConfig, typeConfig } from '../property-menu.js';

export class RecordField extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
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
    const properties = this.view.detailProperties$.value;
    popMenu(ele, {
      options: {
        input: inputConfig(this.column),
        items: [
          {
            type: 'group',
            name: 'Column Prop Group ',
            children: () => [typeConfig(this.column)],
          },
          {
            type: 'action',
            name: 'Duplicate Column',
            icon: DuplicateIcon(),
            hide: () =>
              !this.column.duplicate || this.column.type$.value === 'title',
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
              ${MoveLeftIcon()}
            </div>`,
            hide: () => properties.findIndex(v => v === this.column.id) === 0,
            select: () => {
              const index = properties.findIndex(v => v === this.column.id);
              const targetId = properties[index - 1];
              if (!targetId) {
                return;
              }
              this.view.propertyMove(this.column.id, {
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
              ${MoveRightIcon()}
            </div>`,
            hide: () =>
              properties.findIndex(v => v === this.column.id) ===
              properties.length - 1,
            select: () => {
              const index = properties.findIndex(v => v === this.column.id);
              const targetId = properties[index + 1];
              if (!targetId) {
                return;
              }
              this.view.propertyMove(this.column.id, {
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
                icon: DeleteIcon(),
                hide: () =>
                  !this.column.delete || this.column.type$.value === 'title',
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

  cell$ = computed(() => {
    return this.column.cellGet(this.rowId);
  });

  changeEditing = (editing: boolean) => {
    const selection = this.closest('affine-data-view-record-detail')?.selection;
    if (selection) {
      selection.selection = {
        propertyId: this.column.id,
        isEditing: editing,
      };
    }
  };

  get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

  private get readonly() {
    return this.view.readonly$.value;
  }

  override render() {
    const column = this.column;

    const props: CellRenderProps = {
      cell: this.cell$.value,
      isEditing: this.editing,
      selectCurrentCell: this.changeEditing,
    };
    const renderer = this.column.renderer$.value;
    if (!renderer) {
      return;
    }
    const { view, edit } = renderer;
    const contentClass = classMap({
      'field-content': true,
      empty: !this.editing && this.cell$.value.isEmpty$.value,
      'is-editing': this.editing,
      'is-focus': this.isFocus,
    });
    return html`
      <div>
        <div class="field-left" @click="${this._clickLeft}">
          <div class="icon">
            <uni-lit .uni="${this.column.icon}"></uni-lit>
          </div>
          <div class="filed-name">${column.name$.value}</div>
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

  @property({ attribute: false })
  accessor column!: Property;

  @state()
  accessor editing = false;

  @state()
  accessor isFocus = false;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor view!: SingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-record-field': RecordField;
  }
}
