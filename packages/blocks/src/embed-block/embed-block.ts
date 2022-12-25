import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import type { EmbedBlockModel } from './embed-model.js';
import style from './style.css?inline';

@customElement('affine-embed')
export class EmbedBlockComponent extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;
  @property()
  model!: EmbedBlockModel;

  @property()
  readonly!: boolean;

  @query('input')
  _input!: HTMLInputElement;

  createRenderRoot() {
    return this;
  }

  @state()
  _caption!: string;

  firstUpdated() {
    this._caption = this.model?.caption ?? '';
    if (this._caption) {
      this._input.classList.add('caption-show');
    }
  }

  private _onInputChange() {
    this._caption = this._input.value;
    this.model.page.updateBlock(this.model, { caption: this._caption });
  }

  private _onInputBlur() {
    if (!this._caption) {
      this._input.classList.remove('caption-show');
    }
  }

  render() {
    return html`
      <div class="affine-embed-block-container">
        <div class="affine-embed-wrapper">
          <slot></slot>
          <input
            .disabled=${this.readonly}
            placeholder="Write a caption"
            class="affine-embed-wrapper-caption"
            value=${this._caption}
            @input=${this._onInputChange}
            @blur=${this._onInputBlur}
            @click=${(e: Event) => {
              e.stopPropagation();
            }}
          />
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed': EmbedBlockComponent;
  }
}
