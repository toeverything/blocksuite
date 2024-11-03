import {
  menu,
  type MenuConfig,
  popMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { ArrowDownSmallIcon } from '@blocksuite/icons/lit';
import { Text } from '@blocksuite/store';
import { autoPlacement, offset } from '@floating-ui/dom';
import { computed, signal } from '@preact/signals-core';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { GroupData } from '../../../core/group-by/manager.js';
import type { StatisticsConfig } from '../../../core/statistics/types.js';
import type { TableColumn } from '../table-view-manager.js';

import { typeSystem } from '../../../core/index.js';
import { statsFunctions } from '../../../core/statistics/index.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../consts.js';

const styles = css`
  .stats-cell {
    cursor: pointer;
    transition: opacity 230ms ease;
    font-size: 12px;
    color: var(--affine-text-secondary-color);
    display: flex;
    opacity: 0;
    min-width: ${DEFAULT_COLUMN_MIN_WIDTH}px;
    justify-content: flex-end;
    height: 100%;
    align-items: center;
    user-select: none;
  }

  .affine-database-column-stats:hover .stats-cell {
    opacity: 1;
  }

  .stats-cell:hover,
  affine-database-column-stats-cell.active .stats-cell {
    opacity: 1;
    background-color: var(--affine-hover-color);
    cursor: pointer;
  }

  .stats-cell[calculated='true'] {
    opacity: 1;
  }

  .stats-cell .content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    margin-inline: 5px;
  }

  .label {
    text-transform: uppercase;
    color: var(--affine-text-secondary-color);
  }

  .value {
    color: var(--affine-text-primary-color);
  }
`;

export class DatabaseColumnStatsCell extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  @property({ attribute: false })
  accessor column!: TableColumn;

  cellValues$ = computed(() => {
    if (this.group) {
      return this.group.rows.map(id => {
        return this.column.valueGet(id);
      });
    }
    return this.column.cells$.value.map(cell => cell.value$.value);
  });

  groups$ = computed(() => {
    const groups: Record<string, Record<string, StatisticsConfig>> = {};

    statsFunctions.forEach(func => {
      if (!typeSystem.unify(this.column.dataType$.value, func.dataType)) {
        return;
      }
      if (!groups[func.group]) {
        groups[func.group] = {};
      }
      const oldFunc = groups[func.group][func.type];
      if (!oldFunc || typeSystem.unify(func.dataType, oldFunc.dataType)) {
        if (!func.impl) {
          delete groups[func.group][func.type];
        } else {
          groups[func.group][func.type] = func;
        }
      }
    });
    return groups;
  });

  openMenu = (ev: MouseEvent) => {
    const menus: MenuConfig[] = Object.entries(this.groups$.value).map(
      ([group, funcs]) => {
        return menu.subMenu({
          name: group,
          options: {
            items: Object.values(funcs).map(func => {
              return menu.action({
                isSelected: func.type === this.column.statCalcOp$.value,
                name: func.menuName ?? func.type,
                select: () => {
                  this.column.updateStatCalcOp(func.type);
                },
              });
            }),
          },
        });
      }
    );
    popMenu(popupTargetFromElement(ev.currentTarget as HTMLElement), {
      options: {
        items: [
          menu.action({
            isSelected: !this.column.statCalcOp$.value,
            name: 'None',
            select: () => {
              this.column.updateStatCalcOp();
            },
          }),
          ...menus,
        ],
      },
      middleware: [
        autoPlacement({ allowedPlacements: ['top', 'bottom'] }),
        offset(10),
      ],
    });
  };

  statsFunc$ = computed(() => {
    return Object.values(this.groups$.value)
      .flatMap(group => Object.values(group))
      .find(func => func.type === this.column.statCalcOp$.value);
  });

  values$ = signal<unknown[]>([]);

  statsResult$ = computed(() => {
    const meta = this.column.view.propertyMetaGet(this.column.type$.value);
    if (!meta) {
      return null;
    }
    const func = this.statsFunc$.value;
    if (!func) {
      return null;
    }
    return {
      name: func.displayName,
      value: func.impl?.(this.values$.value, { meta }) ?? '',
    };
  });

  subscriptionMap = new Map<unknown, () => void>();

  override connectedCallback(): void {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'click', this.openMenu);
    this.disposables.add(
      this.cellValues$.subscribe(values => {
        const map = new Map<unknown, () => void>();
        values.forEach(value => {
          if (value instanceof Text) {
            const unsub = this.subscriptionMap.get(value);
            if (unsub) {
              map.set(value, unsub);
              this.subscriptionMap.delete(value);
            } else {
              const f = () => {
                this.values$.value = [...this.cellValues$.value];
              };
              value.yText.observe(f);
              map.set(value, () => {
                value.yText.unobserve(f);
              });
            }
          }
        });
        this.subscriptionMap.forEach(unsub => {
          unsub();
        });
        this.subscriptionMap = map;
        this.values$.value = this.cellValues$.value;
      })
    );
    this.disposables.add(() => {
      this.subscriptionMap.forEach(unsub => {
        unsub();
      });
    });
  }

  protected override render() {
    const style = {
      width: `${this.column.width$.value}px`,
    };
    return html` <div
      calculated="${!!this.column.statCalcOp$.value}"
      style="${styleMap(style)}"
      class="stats-cell"
    >
      <div class="content">
        ${!this.statsResult$.value
          ? html`Calculate ${ArrowDownSmallIcon()}`
          : html`
              <span class="label">${this.statsResult$.value.name}</span>
              <span class="value">${this.statsResult$.value.value} </span>
            `}
      </div>
    </div>`;
  }

  @property({ attribute: false })
  accessor group: GroupData | undefined = undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-stats-cell': DatabaseColumnStatsCell;
  }
}
