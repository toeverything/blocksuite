import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { DataViewTableManager } from '../table-view-manager.js';

const styles = css`
  .affine-database-column-stats {
    width: 100%;
    margin-left: 8px;
    display: flex;
  }
`;
@customElement('affine-database-column-stats')
export class DataBaseColumnStats extends WithDisposable(LitElement) {
  static override styles = styles;
  @property({ attribute: false })
  view!: DataViewTableManager;

  override connectedCallback(): void {
    super.connectedCallback();
    this.disposables.add(
      this.view.slots.update.on(() => {
        this.requestUpdate();
        this.querySelectorAll('affine-database-column-stats').forEach(e =>
          e.requestUpdate()
        );
      })
    );
  }
  protected override render() {
    const cols = this.view.columnManagerList;

    return html`
      <div class="affine-database-column-stats">
        ${repeat(
          cols,
          col => col.id,
          col => {
            return html`<affine-database-column-stats-cell
              .column="${col}"
            ></affine-database-column-stats-cell>`;
          }
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-stats': DataBaseColumnStats;
  }
}
