import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DatabaseBlockModel } from './database-model.js';
import { DatabaseBlockDisplayMode } from './database-model.js';
import { repeat } from 'lit/directives/repeat.js';
import {
  BLOCK_ID_ATTR,
  BlockChildrenContainer,
  BlockHost,
  NonShadowLitElement,
} from '../__internal__/index.js';

@customElement('affine-database')
// cannot find children in shadow dom
export class DatabaseBlock extends NonShadowLitElement {
  @property({
    hasChanged() {
      return true;
    },
  })
  model!: DatabaseBlockModel;
  @property()
  host!: BlockHost;

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  protected render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    if (this.model.mode === DatabaseBlockDisplayMode.Text) {
      const childrenContainer = BlockChildrenContainer(
        this.model,
        this.host,
        () => this.requestUpdate()
      );
      return html` <div>${childrenContainer}</div> `;
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
