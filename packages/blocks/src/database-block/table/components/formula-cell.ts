import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { ArrowDownIcon } from '../../../_common/icons/text.js';
import type { DataViewTableColumnManager } from '../table-view-manager.js';

const styles = css`
  .formula-cell {
    cursor: pointer;
    padding: 8px 3px;
    transition: opacity 230ms ease;
    font-size: 12px;
    color: var(--affine-text-secondary-color);
    display: flex;
    justify-content: flex-end;
    opacity: 0;
  }
  .formula-cell:hover {
    background-color: var(--affine-hover-color);
    cursor: pointer;
    opacity: 1;
  }
  .formula-cell .content {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

@customElement('affine-database-formula-cell')
export class DatabaseFormulaCell extends LitElement {
  static override styles = styles;
  @property({ attribute: false })
  column!: DataViewTableColumnManager;

  protected override render() {
    const style = {
      width: `${this.column.width}px`,
    };
    return html`<div style="${styleMap(style)}" class="formula-cell">
      <div class="content">Calculate ${ArrowDownIcon}</div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-formula-cell': DatabaseFormulaCell;
  }
}
