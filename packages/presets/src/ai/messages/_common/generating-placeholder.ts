import { WithDisposable } from '@blocksuite/block-std';
import { AIStarIcon } from '@blocksuite/blocks';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ai-generating-placeholder')
class AIGeneratingPlaceholder extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 100%;
      border-radius: 4px;
      border: 2px solid var(--affine-primary-color, #1e96eb);
      background: var(--affine-blue-50, #effaff);
    }

    .center {
      display: flex;
      color: var(--affine-brand-color);
    }

    .center svg {
      scale: 1.6;
    }
  `;

  @property({ attribute: false })
  height: number = 300;

  protected override render() {
    return html` <style>
        :host {
          height: ${this.height}px;
        }
      </style>
      <div class="center">${AIStarIcon}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-generating-placeholder': AIGeneratingPlaceholder;
  }
}
