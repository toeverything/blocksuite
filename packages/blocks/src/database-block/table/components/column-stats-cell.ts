import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { positionToVRect } from '../../../_common/components/menu/menu.js';
import { ArrowDownIcon } from '../../../_common/icons/text.js';
import { getRootByElement } from '../../../_common/utils/query.js';
import type { CalculationType, StatCalc, StatResult } from '../formulas.js';
import type { DataViewTableColumnManager } from '../table-view-manager.js';
import { popFormulaMenu } from './menu.js';

const styles = css`
  .stats-cell {
    cursor: pointer;
    padding: 8px 3px;
    transition: opacity 230ms ease;
    font-size: 12px;
    color: var(--affine-text-secondary-color);
    display: flex;
    opacity: 0;
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

  @property({ attribute: false })
  column!: DataViewTableColumnManager;

  @state()
  private formula: StatCalc | null = null;

  @state()
  private result: StatResult | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'click', this.openMenu);
    this.disposables.add(
      this.column.dataViewManager.slots.update.on(() => {
        if (this.formula) this.onSelect(this.formula);
        // change this
      })
    );
  }

  protected override render() {
    const style = {
      width: `${this.column.width}px`,
    };
    return html`<div
      calculated="${!!this.formula}"
      style="${styleMap(style)}"
      class="stats-cell"
    >
      <div class="content">
        ${!this.formula
          ? html`Calculate ${ArrowDownIcon}`
          : html`
              <span class="label">${this.formula.display}</span>
              <span class="value">${this.getResultString()} </span>
            `}
      </div>
    </div>`;
  }

  private getResultString() {
    if (!this.result) return '';
    const { type, value } = this.result;
    switch (type) {
      case '%':
        return `${(value * 100).toFixed(3)}%`;
      case 'x10':
        return `${value}`;
    }
  }

  openMenu = (ev: MouseEvent) => {
    const rootElement = getRootByElement(this);
    popFormulaMenu(
      rootElement,
      positionToVRect(ev.x, ev.y),
      this.column,
      this.getCalculationType(),
      this.onSelect
    );
  };
  onSelect = (formula: StatCalc) => {
    if (formula.type === 'none') {
      this.formula = null;
      this.result = null;
      return;
    }

    this.formula = formula;
    this.result = formula.calculate(this.column);
  };

  getCalculationType(): CalculationType {
    return this.column.type === 'number' ? 'math' : 'common';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-stats-cell': DatabaseColumnStatsCell;
  }
}
