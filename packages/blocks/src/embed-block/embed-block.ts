import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import type { EmbedBlockModel } from './embed-model';

import style from './style.css?raw';

@customElement('embed-block')
export class EmbedBlockComponent extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;
  @property()
  model!: EmbedBlockModel;

  @query('input')
  _input!: HTMLInputElement;
  createRenderRoot() {
    return this;
  }
  @state()
  _caption!: string;

  override firstUpdated() {
    this._caption = this.model?.caption ?? '';
  }
  private _inputChange() {
    this._caption = this._input.value;
    this.model.page.updateBlock(this.model, { caption: this._caption });
  }
  render() {
    return html`
      <div class=${`affine-embed-block-container`}>
        <div class=${`affine-embed-wrapper`}>
          <slot></slot>
          <input
            placeholder="write a caption"
            class="affine-embed-wrapper-caption"
            value=${this._caption}
            @input=${this._inputChange}
          />
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-block': EmbedBlockComponent;
  }
}
