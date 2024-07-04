import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { ArrowDownIcon } from '../../../../../../_common/icons/index.js';
import { getRootByElement } from '../../../../../../_common/utils/index.js';
import type { GroupData } from '../../../../common/group-by/helper.js';
import {
  type ColumnDataType,
  getStatCalcOperationFromType,
  type StatCalcOp,
  type StatOpResult,
} from '../stat-ops.js';
import type { DataViewTableColumnManager } from '../table-view-manager.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from './../consts.js';
import { popColStatOperationMenu } from './menu.js';

const styles = css`
  .stats-cell {
    cursor: pointer;
    transition: opacity 230ms ease;
    padding: 8px 0px;
    font-size: 12px;
    color: var(--affine-text-secondary-color);
    display: flex;
    opacity: 0;
    min-width: ${DEFAULT_COLUMN_MIN_WIDTH}px;
    justify-content: flex-end;
  }
  .stats-cell:hover {
    background-color: var(--affine-hover-color);
    cursor: pointer;
    opacity: 1;
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
  }
  .value {
    color: var(--affine-text-primary-color);
  }
`;

@customElement('affine-database-column-stats-cell')
export class DatabaseColumnStatsCell extends WithDisposable(LitElement) {
  static override styles = styles;

  @state()
  private accessor operation: StatCalcOp | null = null;

  @state()
  private accessor result: StatOpResult | null = null;

  @property({ attribute: false })
  accessor column!: DataViewTableColumnManager;

  @property({ attribute: false })
  accessor group: GroupData | undefined = undefined;

  private getResultString() {
    if (!this.result || !isFinite(this.result.value)) return '';
    const { displayFormat: df, value } = this.result;

    switch (df) {
      case '%':
        return `${(value * 100).toFixed(3)}%`;
      case 'x10':
        return `${value}`;
    }
  }

  protected override render() {
    const style = {
      width: `${this.column.width}px`,
    };
    return html`<div
      calculated="${!!this.operation && this.operation.type !== 'none'}"
      style="${styleMap(style)}"
      class="stats-cell"
    >
      <div class="content">
        ${!this.operation || this.operation.type === 'none'
          ? html`Calculate ${ArrowDownIcon}`
          : html`
              <span class="label">${this.operation.display}</span>
              <span class="value">${this.getResultString()} </span>
            `}
      </div>
    </div>`;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.operation = getStatCalcOperationFromType(this.column.statCalcOp);
    this.calculate();

    this.disposables.addFromEvent(this, 'click', this.openMenu);

    const view = this.column.dataViewManager;
    this.disposables.add(
      view.slots.update.on(() => {
        this.calculate();
      })
    );

    view.rows.forEach(rowId => {
      this._disposables.add(
        this.column.onCellUpdate(rowId, () => {
          this.calculate();
        })
      );
    });
  }

  openMenu = (ev: MouseEvent) => {
    const rootElement = getRootByElement(this);
    popColStatOperationMenu(
      rootElement,
      ev.target as HTMLElement,
      this.column,
      this.getColumnType(),
      this.onSelect
    );
  };

  onSelect = (operation: StatCalcOp) => {
    if (operation.type === 'none') {
      this.operation = null;
      this.result = null;
      return;
    }
    this.column.updateStatCalcOp(operation.type);
    this.operation = operation;
    this.calculate();
  };

  calculate() {
    if (!this.operation) return;
    this.result = this.operation.calculate(this.column, this.group);
  }

  getColumnType(): ColumnDataType {
    const type = this.column.type;
    if (type === 'number' || type === 'checkbox') return type;
    return 'other';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-stats-cell': DatabaseColumnStatsCell;
  }
}
