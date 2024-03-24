import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { DataViewTableManager } from '../table-view-manager.js';

const styles = css`
  .affine-database-formula-container {
    display: flex;
  }
`;
@customElement('affine-database-formula-container')
export class DataBaseFormulaContainer extends WithDisposable(LitElement) {
  static override styles = styles;
  @property({ attribute: false })
  view!: DataViewTableManager;

  override connectedCallback(): void {
    super.connectedCallback();
    this.disposables.add(
      this.view.slots.update.on(() => {
        this.requestUpdate();
        this.querySelectorAll('affine-database-formula-cell').forEach(e =>
          e.requestUpdate()
        );
      })
    );
  }
  protected override render() {
    const cols = this.view.columnManagerList;

    return html`
      <div class="affine-database-formula-container">
        ${repeat(
          cols,
          col => col.id,
          col => {
            return html`<affine-database-formula-cell
              .column="${col}"
            ></affine-database-formula-cell>`;
          }
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-formula-container': DataBaseFormulaContainer;
  }
}
