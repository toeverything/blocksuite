import { BlockElement } from '@blocksuite/lit';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { registerService } from '../__internal__/service.js';
import type { EmbedBlockModel } from './embed-model.js';
import { EmbedBlockService } from './embed-service.js';

@customElement('affine-embed')
export class EmbedBlockComponent extends BlockElement<EmbedBlockModel> {
  static override styles = css`
    affine-embed {
      display: block;
    }
    .affine-embed-wrapper {
      text-align: center;
      margin-bottom: calc(var(--affine-paragraph-space) + 8px);
    }
    .affine-embed-wrapper-caption {
      width: 100%;
      font-size: var(--affine-font-sm);
      outline: none;
      border: 0;
      font-family: inherit;
      text-align: center;
      color: var(--affine-icon-color);
      display: none;
      background: var(--affine-background-primary-color);
    }
    .affine-embed-wrapper-caption::placeholder {
      color: var(--affine-placeholder-color);
    }

    .affine-embed-wrapper .caption-show {
      display: inline-block;
    }
  `;

  @query('input')
  _input!: HTMLInputElement;

  @state()
  private _caption!: string;

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:embed', EmbedBlockService);
  }

  override firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);

    this.updateComplete.then(() => {
      this._caption = this.model?.caption ?? '';

      if (this._caption.length > 0) {
        // Caption input should be toggled manually.
        // Otherwise it will be lost if the caption is deleted into empty state.
        this._input.classList.add('caption-show');
      }
    });

    // The embed block can not be focused,
    // so the active element will be the last activated element.
    // If the active element is the title textarea,
    // any event will dispatch from it and be ignored. (Most events will ignore title)
    // so we need to blur it.
    // See also https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement
    this.addEventListener('click', () => {
      if (
        document.activeElement &&
        document.activeElement instanceof HTMLElement
      ) {
        document.activeElement.blur();
      }
    });
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

  override render() {
    const slot =
      this.model.type === 'image'
        ? html`<affine-image .model=${this.model}></affine-image>`
        : nothing;
    return html`
      ${slot}
      <div class="affine-embed-block-container">
        <div class="affine-embed-wrapper">
          <input
            .disabled=${this.model.page.readonly}
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
