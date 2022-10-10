import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { BLOCK_ID_ATTR, type BlockHost } from '@blocksuite/shared';
import type { PageBlockModel } from './page-model';
import { focusTextEnd, BlockChildrenContainer } from '../__internal__';
import style from './style.css';

@customElement('page-block-element')
export class PageBlockElement extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property()
  host!: BlockHost;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  @query('.affine-page-block-title')
  _blockTitle!: HTMLInputElement;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.model.propsUpdated.on(() => {
      if (this.model.title !== this._blockTitle.value) {
        this.requestUpdate();
      }
    });

    focusTextEnd(this._blockTitle);
  }

  private _onTitleInput(e: InputEvent) {
    const { store } = this.host;

    if (!this.model.id) {
      const title = (e.target as HTMLInputElement).value;
      store.addBlock({ flavour: 'page', title });
      store.addBlock({ flavour: 'paragraph' });
      return;
    }

    const title = (e.target as HTMLInputElement).value;
    store.updateBlock(this.model, { title });
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = BlockChildrenContainer(this.model, this.host);

    return html`
      <div class="affine-page-block-container">
        <div class="affine-page-block-title-container">
          <input
            placeholder="Title"
            class="affine-page-block-title"
            value=${this.model.title}
            @input=${this._onTitleInput}
          />
        </div>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-block-element': PageBlockElement;
  }
}
