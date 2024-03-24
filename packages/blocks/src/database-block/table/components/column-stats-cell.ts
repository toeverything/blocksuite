import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { positionToVRect } from '../../../_common/components/menu/menu.js';
import { ArrowDownIcon } from '../../../_common/icons/text.js';
import { getRootByElement } from '../../../_common/utils/query.js';
import type { CalculationType, IFormula } from '../formulas.js';
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
  private formula: IFormula | null = null;

  @state()
  private calculated: number | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'click', this.openMenu);
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
              <span class="value">${this.calculated ?? 0} </span>
            `}
      </div>
    </div>`;
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
  onSelect = (formula: IFormula) => {
    if (formula.type === 'none') return (this.formula = null);
    this.formula = formula;
    const data = this.column.dataViewManager.rows.map(rId => {
      return this.column.getStringValue(rId);
    });

    console.log(this.calculate(this.formula, data));

    return;
  };

  calculate(formula: IFormula, data: string[]) {
    return formula.calculate(data, this.column);
  }

  getCalculationType(): CalculationType {
    return this.column.type === 'number' ? 'math' : 'common';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-stats-cell': DatabaseColumnStatsCell;
  }
}
