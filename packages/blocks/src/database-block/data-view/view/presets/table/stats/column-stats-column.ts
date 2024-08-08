import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { SignalWatcher, computed } from '@lit-labs/preact-signals';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { GroupData } from '../../../../common/group-by/helper.js';
import type { StatsFunction } from '../../../../common/stats/type.js';
import type { TableColumn } from '../table-view-manager.js';

import {
  type Menu,
  popFilterableSimpleMenu,
} from '../../../../../../_common/components/index.js';
import { ArrowDownIcon } from '../../../../../../_common/icons/index.js';
import { statsFunctions } from '../../../../common/stats/index.js';
import { typesystem } from '../../../../logical/typesystem.js';
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
  }

  .affine-database-column-stats:hover .stats-cell {
    opacity: 1;
  }

  .stats-cell:hover {
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

@customElement('affine-database-column-stats-cell')
export class DatabaseColumnStatsCell extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  columnValues$ = computed(() => {
    return this.column.view.rows$.value.map(rowId =>
      this.column.view.viewManager.dataSource.cellGetValue(
        rowId,
        this.column.id
      )
    );
  });

  openMenu = (ev: MouseEvent) => {
    const groups: Record<string, StatsFunction[]> = {};

    statsFunctions.forEach(func => {
      if (!typesystem.isSubtype(func.dataType, this.column.dataType)) {
        return;
      }
      if (!groups[func.group]) {
        groups[func.group] = [];
      }
      groups[func.group].push(func);
    });
    const menus: Menu[] = Object.entries(groups).map(([group, funcs]) => {
      return {
        type: 'sub-menu',
        name: group,
        options: {
          input: { search: true },
          items: funcs.map(func => {
            return {
              type: 'action',
              isSelected: func.type === this.column.statCalcOp$.value,
              name: func.name,
              select: () => {
                this.column.updateStatCalcOp(func.type);
              },
            };
          }),
        },
      };
    });
    popFilterableSimpleMenu(ev.target as HTMLElement, [
      {
        type: 'action',
        isSelected: !this.column.statCalcOp$.value,
        name: 'None',
        select: () => {
          this.column.updateStatCalcOp();
        },
      },
      ...menus,
    ]);
  };

  statsFunc$ = computed(() => {
    return statsFunctions.find(
      func => func.type === this.column.statCalcOp$.value
    );
  });

  statsResult$ = computed(() => {
    const meta = this.column.view.columnGetMeta(this.column.type);
    if (!meta) {
      return null;
    }
    const func = this.statsFunc$.value;
    if (!func) {
      return null;
    }
    return {
      name: func.name,
      value: func.impl(this.columnValues$.value, { meta }),
    };
  });

  override connectedCallback(): void {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'click', this.openMenu);
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
          ? html`Calculate ${ArrowDownIcon}`
          : html`
              <span class="label">${this.statsResult$.value.name}</span>
              <span class="value">${this.statsResult$.value.value} </span>
            `}
      </div>
    </div>`;
  }

  @property({ attribute: false })
  accessor column!: TableColumn;

  @property({ attribute: false })
  accessor group: GroupData | undefined = undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-stats-cell': DatabaseColumnStatsCell;
  }
}
