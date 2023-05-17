import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { DatabaseBlockModel } from '../database-model.js';

@customElement('database-view-header')
export class DatabaseViewHeader extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .database-view-header {
      display: flex;
      user-select: none;
    }

    .database-view-button {
      border: 1px solid gray;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
    }
    .database-view-button.active {
      background-color: gray;
    }
  `;
  @property()
  model!: DatabaseBlockModel;

  @property()
  currentView?: string;

  override connectedCallback() {
    super.connectedCallback();
  }

  override render() {
    const views = this.model.getViewList();

    return html`
      <div class="database-view-header">
        ${repeat(
          views,
          v => v.id,
          view => {
            return html` <div
              class="database-view-button ${this.currentView === view.id
                ? 'active'
                : ''}"
            >
              ${view.name}
            </div>`;
          }
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'database-view-header': DatabaseViewHeader;
  }
}
