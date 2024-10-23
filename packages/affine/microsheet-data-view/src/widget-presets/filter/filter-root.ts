import {
  menu,
  popFilterableSimpleMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher } from '@blocksuite/global/utils';
import {
  ConvertIcon,
  DeleteIcon,
  DuplicateIcon,
  MoreHorizontalIcon,
} from '@blocksuite/icons/lit';
import { computed, type ReadonlySignal } from '@preact/signals-core';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import type { Filter, FilterGroup, Variable } from '../../core/common/ast.js';
import type { FilterGroupView } from './filter-group.js';

import { getDepth } from './filter-group.js';

export class FilterRootView extends SignalWatcher(ShadowlessElement) {
  static override styles = css`
    .filter-root-title {
      padding: 12px;
      font-size: 14px;
      font-weight: 600;
      line-height: 22px;
      color: var(--affine-text-primary-color);
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
      gap: 4px;
      max-height: 400px;
      overflow: auto;
    }

    .filter-root-button {
      margin: 4px 8px 8px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      line-height: 22px;
      border-radius: 4px;
      cursor: pointer;
      color: var(--affine-text-secondary-color);
    }

    .filter-root-button svg {
      fill: var(--affine-text-secondary-color);
      color: var(--affine-text-secondary-color);
      width: 20px;
      height: 20px;
    }

    .filter-root-button:hover {
      background-color: var(--affine-hover-color);
      color: var(--affine-text-primary-color);
    }
    .filter-root-button:hover svg {
      fill: var(--affine-text-primary-color);
      color: var(--affine-text-primary-color);
    }

    .filter-root-item {
      padding: 4px 0;
      display: flex;
      align-items: start;
      gap: 8px;
    }

    .filter-group-title {
      font-size: 14px;
      font-style: normal;
      font-weight: 500;
      line-height: 22px;
      display: flex;
      align-items: center;
      color: var(--affine-text-primary-color);
      gap: 6px;
    }

    .filter-root-item-ops {
      margin-top: 2px;
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
      fill: var(--affine-text-secondary-color);
      color: var(--affine-text-secondary-color);
      width: 18px;
      height: 18px;
    }
    .filter-root-item-ops:hover svg {
      fill: var(--affine-text-primary-color);
      color: var(--affine-text-primary-color);
    }

    .filter-root-grabber {
      cursor: grab;
      width: 4px;
      height: 12px;
      background-color: var(--affine-placeholder-color);
      border-radius: 1px;
    }

    .divider {
      height: 1px;
      background-color: var(--affine-divider-color);
      flex-shrink: 0;
      margin: 8px 0;
    }
  `;

  private _setFilter = (index: number, filter: Filter) => {
    this.onChange({
      ...this.filterGroup.value,
      conditions: this.filterGroup.value.conditions.map((v, i) =>
        index === i ? filter : v
      ),
    });
  };

  private _clickConditionOps(target: HTMLElement, i: number) {
    const filter = this.filterGroup.value.conditions[i];
    popFilterableSimpleMenu(popupTargetFromElement(target), [
      menu.action({
        name: filter.type === 'filter' ? 'Turn into group' : 'Wrap in group',
        prefix: ConvertIcon(),
        onHover: hover => {
          this.containerClass = hover
            ? { index: i, class: 'hover-style' }
            : undefined;
        },
        hide: () => getDepth(filter) > 3,
        select: () => {
          this.onChange({
            type: 'group',
            op: 'and',
            conditions: [this.filterGroup.value],
          });
        },
      }),
      menu.action({
        name: 'Duplicate',
        prefix: DuplicateIcon(),
        onHover: hover => {
          this.containerClass = hover
            ? { index: i, class: 'hover-style' }
            : undefined;
        },
        select: () => {
          const conditions = [...this.filterGroup.value.conditions];
          conditions.splice(
            i + 1,
            0,
            JSON.parse(JSON.stringify(conditions[i]))
          );
          this.onChange({ ...this.filterGroup.value, conditions: conditions });
        },
      }),
      menu.group({
        name: '',
        items: [
          menu.action({
            name: 'Delete',
            prefix: DeleteIcon(),
            class: 'delete-item',
            onHover: hover => {
              this.containerClass = hover
                ? { index: i, class: 'delete-style' }
                : undefined;
            },
            select: () => {
              const conditions = [...this.filterGroup.value.conditions];
              conditions.splice(i, 1);
              this.onChange({
                ...this.filterGroup.value,
                conditions,
              });
            },
          }),
        ],
      }),
    ]);
  }

  override render() {
    const data = this.filterGroup.value;
    return html`
      <div class="filter-root-container">
        ${repeat(data.conditions, (filter, i) => {
          const clickOps = (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            this._clickConditionOps(e.target as HTMLElement, i);
          };
          const ops = html`
            <div class="filter-root-item-ops" @click="${clickOps}">
              ${MoreHorizontalIcon()}
            </div>
          `;
          const content =
            filter.type === 'filter'
              ? html`
                  <div
                    style="display:flex;align-items:center;justify-content: space-between;width: 100%;gap:8px;"
                  >
                    <div style="display:flex;align-items:center;gap:6px;">
                      <div class="filter-root-grabber"></div>
                      <microsheet-filter-condition-view
                        .setData="${(v: Filter) => this._setFilter(i, v)}"
                        .vars="${this.vars.value}"
                        .data="${filter}"
                      ></microsheet-filter-condition-view>
                    </div>
                    ${ops}
                  </div>
                `
              : html`
                  <div style="width: 100%;">
                    <div
                      style="display:flex;align-items:center;justify-content: space-between;gap:8px"
                    >
                      <div class="filter-group-title">
                        <div class="filter-root-grabber"></div>
                        Filter group
                      </div>
                      ${ops}
                    </div>
                    <div style="width: 100%;padding: 12px 0 0;">
                      <microsheet-filter-group-view
                        style="padding: 0"
                        .onChange="${(v: Filter) => this._setFilter(i, v)}"
                        .vars="${this.vars}"
                        .filterGroup="${computed(() => filter)}"
                      ></microsheet-filter-group-view>
                    </div>
                  </div>
                `;
          const classList = classMap({
            'filter-root-item': true,
            'filter-exactly-hover-container': true,
            'dv-pd-4 dv-round-4': true,
            [this.containerClass?.class ?? '']:
              this.containerClass?.index === i,
          });
          return html` ${data.conditions[i - 1]?.type === 'group' ||
            filter.type === 'group'
              ? html`<div class="divider"></div>`
              : nothing}
            <div @contextmenu=${clickOps} class="${classList}">
              ${content}
            </div>`;
        })}
      </div>
    `;
  }

  @state()
  accessor containerClass:
    | {
        index: number;
        class: string;
      }
    | undefined = undefined;

  @property({ attribute: false })
  accessor filterGroup!: ReadonlySignal<FilterGroup>;

  @property({ attribute: false })
  accessor onBack!: () => void;

  @property({ attribute: false })
  accessor onChange!: (filter: FilterGroup) => void;

  @property({ attribute: false })
  accessor vars!: ReadonlySignal<Variable[]>;
}

declare global {
  interface HTMLElementTagNameMap {
    'microsheet-filter-root-view': FilterGroupView;
  }
}
