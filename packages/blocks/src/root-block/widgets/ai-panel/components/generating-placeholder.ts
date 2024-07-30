import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import {
  LitElement,
  type PropertyValues,
  css,
  html,
  nothing,
  unsafeCSS,
} from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  DarkLoadingIcon,
  LightLoadingIcon,
} from '../../../../_common/icons/text.js';
import { getThemeMode } from '../../../../_common/utils/query.js';

@customElement('generating-placeholder')
class GeneratingPlaceholder extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin-bottom: 8px;
    }

    .generating-header {
      width: 100%;
      font-size: var(--affine-font-xs);
      font-style: normal;
      font-weight: 500;
      line-height: 20px;
      height: 20px;
    }

    .generating-header,
    .loading-progress {
      color: var(--affine-text-secondary-color);
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }

    .generating-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 100%;
      border-radius: 4px;
      border: 2px solid var(--affine-primary-color, #1e96eb);
      background: var(--affine-blue-50, #effaff);
      color: var(--affine-brand-color);
      gap: 4px;
    }

    .generating-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 24px;
    }

    .generating-icon svg {
      scale: 1.5;
    }

    .loading-progress {
      display: flex;
      flex-direction: column;
      font-style: normal;
      font-weight: 400;
      text-align: center;
      gap: 4px;
    }

    .loading-text {
      font-size: var(--affine-font-base);
      height: 24px;
      line-height: 24px;
    }

    .loading-stage {
      font-size: var(--affine-font-xs);
      height: 20px;
      line-height: 20px;
    }
  `;

  protected override render() {
    const theme = getThemeMode();
    const loadingText = this.stages[this.loadingProgress - 1] || '';

    return html`<style>
        .generating-body {
          height: ${this.height}px;
        }
      </style>
      ${this.showHeader
        ? html`<div class="generating-header">Answer</div>`
        : nothing}
      <div class="generating-body">
        <div class="generating-icon">
          ${theme === 'light' ? LightLoadingIcon : DarkLoadingIcon}
        </div>
        <div class="loading-progress">
          <div class="loading-text">${loadingText}</div>
          <div class="loading-stage">
            ${this.loadingProgress} / ${this.stages.length}
          </div>
        </div>
      </div>`;
  }

  override willUpdate(changed: PropertyValues) {
    if (changed.has('loadingProgress')) {
      this.loadingProgress = Math.max(
        1,
        Math.min(this.loadingProgress, this.stages.length)
      );
    }
  }

  @property({ attribute: false })
  accessor height: number = 300;

  @property({ attribute: false })
  accessor loadingProgress!: number;

  @property({ attribute: false })
  accessor showHeader!: boolean;

  @property({ attribute: false })
  accessor stages!: string[];
}

declare global {
  interface HTMLElementTagNameMap {
    'generating-placeholder': GeneratingPlaceholder;
  }
}
