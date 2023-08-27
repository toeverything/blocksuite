import './condition.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { ReferenceElement } from '@floating-ui/dom';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  popFilterableSimpleMenu,
  positionToVRect,
} from '../../../components/menu/index.js';
import {
  DeleteIcon,
  DuplicateIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from '../../../icons/index.js';
import type { Filter, FilterGroup, Variable } from '../ast.js';
import { popAddNewFilter } from './condition.js';
import type { FilterGroupView } from './filter-group.js';

@customElement('filter-root-view')
export class FilterRootView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    filter-root-view {
      border-radius: 4px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      user-select: none;
      gap: 4px;
    }

    .filter-root-op {
      width: 60px;
      display: flex;
      justify-content: end;
      padding: 4px;
      height: 34px;
      align-items: center;
    }

    .filter-root-op-clickable {
      border-radius: 4px;
      cursor: pointer;
    }

    .filter-root-op-clickable:hover {
      background-color: var(--affine-hover-color);
    }

    .filter-root-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 400px;
      overflow: auto;
    }

    .filter-root-button {
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      line-height: 24px;
      border-radius: 4px;
      cursor: pointer;
    }

    .filter-root-button svg {
      fill: var(--affine-icon-color);
      color: var(--affine-icon-color);
      width: 20px;
      height: 20px;
    }

    .filter-root-button:hover {
      background-color: var(--affine-hover-color);
    }

    .filter-root-item {
      padding: 4px 0;
      display: flex;
      align-items: start;
      gap: 8px;
    }

    .filter-root-item-ops {
      margin-top: 4px;
      padding: 4px;
      border-radius: 4px;
      height: max-content;
      display: flex;
      cursor: pointer;
    }

    .filter-root-item-ops:hover {
      background-color: var(--affine-hover-color);
    }

    .filter-root-item-ops svg {
      fill: var(--affine-icon-color);
      color: var(--affine-icon-color);
      width: 18px;
      height: 18px;
    }
    .delete-style {
      background-color: var(--affine-background-error-color);
    }
    .filter-root-grabber {
      cursor: grab;
      width: 4px;
      height: 12px;
      background-color: var(--affine-placeholder-color);
      border-radius: 1px;
    }
  `;
  @property({ attribute: false })
  data!: FilterGroup;

  @property({ attribute: false })
  vars!: Variable[];

  @property({ attribute: false })
  setData!: (filter: FilterGroup) => void;
  @state()
  deleteIndex?: number;
  private _setFilter = (index: number, filter: Filter) => {
    this.setData({
      ...this.data,
      conditions: this.data.conditions.map((v, i) =>
        index === i ? filter : v
      ),
    });
  };

  private _addNew = (e: MouseEvent) => {
    popAddNewFilter(e.currentTarget as HTMLElement, {
      value: this.data,
      onChange: this.setData,
      vars: this.vars,
    });
  };

  private _clickConditionOps(target: ReferenceElement, i: number) {
    popFilterableSimpleMenu(target, [
      {
        type: 'action',
        name: 'Wrap with group',
        select: () => {
          //
        },
      },
      {
        type: 'action',
        name: 'Duplicate',
        icon: DuplicateIcon,
        select: () => {
          //
        },
      },
      {
        type: 'group',
        name: '',
        children: () => [
          {
            type: 'action',
            name: 'Delete',
            icon: DeleteIcon,
            class: 'delete-item',
            onHover: hover => {
              this.deleteIndex = hover ? i : undefined;
            },
            select: () => {
              const conditions = [...this.data.conditions];
              conditions.splice(i, 1);
              this.setData({
                ...this.data,
                conditions,
              });
            },
          },
        ],
      },
    ]);
  }

  override render() {
    const data = this.data;
    return html`
      <div class="filter-root-container">
        ${repeat(data.conditions, (filter, i) => {
          const clickOps = (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            this._clickConditionOps(positionToVRect(e.x, e.y), i);
          };
          const ops = html`
            <div class="filter-root-item-ops" @click="${clickOps}">
              ${MoreHorizontalIcon}
            </div>
          `;
          const content =
            filter.type === 'filter'
              ? html`
                  <div
                    style="display:flex;align-items:center;justify-content: space-between;width: 100%;gap:8px"
                  >
                    <div style="display:flex;align-items:center;gap:6px">
                      <div class="filter-root-grabber"></div>
                      <filter-condition-view
                        .setData="${(v: Filter) => this._setFilter(i, v)}"
                        .vars="${this.vars}"
                        .data="${filter}"
                      ></filter-condition-view>
                    </div>
                    ${ops}
                  </div>
                `
              : html`
                  <div style="width: 100%;">
                    <div
                      style="display:flex;align-items:center;justify-content: space-between;gap:8px"
                    >
                      <div style="display:flex;align-items:center;gap: 6px;">
                        <div class="filter-root-grabber"></div>
                        Filter group
                      </div>
                      ${ops}
                    </div>
                    <filter-group-view
                      style="padding: 0"
                      .setData="${(v: Filter) => this._setFilter(i, v)}"
                      .vars="${this.vars}"
                      .data="${filter}"
                    ></filter-group-view>
                  </div>
                `;
          const classList = classMap({
            'filter-root-item': true,
            'filter-exactly-hover-container': true,
            'hover-pd-round': true,
            'delete-style': this.deleteIndex === i,
          });
          return html` <div @contextmenu=${clickOps} class="${classList}">
            ${content}
          </div>`;
        })}
      </div>
      <div class="filter-root-button add-new" @click="${this._addNew}">
        ${PlusIcon} Add
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-root-view': FilterGroupView;
  }
}
