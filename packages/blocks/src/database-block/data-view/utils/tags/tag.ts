import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { DatabaseSearchClose } from '../../common/icons/index.js';

@customElement('affine-tag-component')
export class TagComponent extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-tag-component {
      width: max-content;
      max-width: 128px;
    }
    .tag-container {
      height: 22px;
      font-size: 14px;
      line-height: 14px;
      padding: 0 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border: 1px solid var(--affine-border-color);
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--affine-background-primary-color);
    }
    .tag-container .tag-point {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .tag-container .tag-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tag-container svg {
      color: var(--affine-icon-color);
      flex-shrink: 0;
    }
    .tag-container svg:hover {
      background-color: var(--affine-hover-color);
      border-radius: 50%;
      cursor: pointer;
    }
  `;

  @property({ attribute: false })
  accessor name: string = '';

  @property({ attribute: false })
  accessor color: string = '';

  @property({ attribute: false })
  accessor close: (() => void) | undefined = undefined;

  override render() {
    const style = styleMap({
      backgroundColor: this.color,
    });

    return html`<div class="tag-container">
      <div style=${style} class="tag-point"></div>
      <div class="tag-name">${this.name}</div>
      ${this.close
        ? html`<div
            style="display: flex;align-items: center"
            @click="${this.close}"
          >
            ${DatabaseSearchClose}
          </div>`
        : nothing}
    </div>`;
  }
}
