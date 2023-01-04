import { html, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import type { EmbedBlockModel } from './embed-model.js';
import { NonShadowLitElement } from '../__internal__/index.js';

@customElement('affine-embed')
export class EmbedBlockComponent extends NonShadowLitElement {
  static styles = css`
    .affine-embed-wrapper {
      /* padding: 10px; */
      text-align: center;
      height: 24px;
    }
    .affine-embed-wrapper-caption {
      width: 100%;
      font-size: var(--affine-font-sm);
      outline: none;
      border: 0;
      font-family: inherit;
      color: inherit;
      text-align: center;
      color: var(--affine-icon-color);
      display: none;
    }
    .affine-embed-wrapper-caption::placeholder {
      color: var(--affine-placeholder-color);
    }

    .affine-embed-wrapper-caption:disabled {
      background-color: var(--affine-page-background);
    }

    .affine-embed-wrapper .caption-show {
      display: inline-block;
    }
  `;
  @property()
  model!: EmbedBlockModel;

  @property()
  readonly!: boolean;

  @query('input')
  _input!: HTMLInputElement;

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
