import { ArrowDownIcon } from '@blocksuite/affine-components/icons';
import { getRootByElement } from '@blocksuite/affine-shared/utils';
import { WithDisposable } from '@blocksuite/block-std';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RootBlockComponent } from '../../../../../../root-block/index.js';
import type { GroupData } from '../../../../common/group-by/helper.js';
import type { TableColumn } from '../table-view-manager.js';

import {
  type ColumnDataType,
  type StatCalcOp,
  type StatOpResult,
  getStatCalcOperationFromType,
} from '../stat-ops.js';
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

  openMenu = (ev: MouseEvent) => {
    const rootComponent = getRootByElement(this) as RootBlockComponent;
    if (!rootComponent) return;
    popColStatOperationMenu(
      rootComponent,
      ev.target as HTMLElement,
      this.column,
      this.getColumnType(),
      this.onSelect
    );
  };

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

  calculate() {
    if (!this.operation) return;
    this.result = this.operation.calculate(this.column, this.group);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.operation = getStatCalcOperationFromType(this.column.statCalcOp);
    this.calculate();

    this.disposables.addFromEvent(this, 'click', this.openMenu);
  }

  getColumnType(): ColumnDataType {
    const type = this.column.type;
    if (type === 'number' || type === 'checkbox') return type;
    return 'other';
  }

  protected override render() {
    const style = {
      width: `${this.column.width$.value}px`,
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

  @property({ attribute: false })
  accessor column!: TableColumn;

  @property({ attribute: false })
  accessor group: GroupData | undefined = undefined;

  @state()
  private accessor operation: StatCalcOp | null = null;

  @state()
  private accessor result: StatOpResult | null = null;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-stats-cell': DatabaseColumnStatsCell;
  }
}
