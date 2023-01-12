import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DatabaseBlockModel } from './database-model.js';
import { DatabaseBlockDisplayMode } from './database-model.js';
import { repeat } from 'lit/directives/repeat.js';

@customElement('affine-database')
export class DatabaseBlock extends LitElement {
  @property({
    hasChanged() {
      return true;
    },
  })
  model!: DatabaseBlockModel;

  protected render() {
    if (this.model.mode === DatabaseBlockDisplayMode.Text) {
      return html``;
    } else if (this.model.mode === DatabaseBlockDisplayMode.Grid) {
      return html``;
    } else if (this.model.mode === DatabaseBlockDisplayMode.Database) {
      return html`
        <div class="affine-database">
          <div class="affine-database-columns">
            ${repeat(
              this.model.columns,
              column => column.id,
              column => html` <div class="affine-database-column">todo</div>`
            )}
          </div>
          <div class="affine-database-rows">
            <div></div>
          </div>
        </div>
      `;
    }
    throw new Error('unreachable');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlock;
  }
}
