import {
  DarkLoadingIcon,
  LightLoadingIcon,
} from '@blocksuite/affine-components/icons';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { WithDisposable } from '@blocksuite/global/utils';
import { baseTheme, cssVar } from '@toeverything/theme';
import {
  css,
  html,
  LitElement,
  nothing,
  type PropertyValues,
  unsafeCSS,
} from 'lit';
import { property } from 'lit/decorators.js';

export class GeneratingPlaceholder extends WithDisposable(LitElement) {
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
      font-size: ${unsafeCSS(cssVar('fontXs'))};
      font-style: normal;
      font-weight: 500;
      line-height: 20px;
      height: 20px;
    }

    .generating-header,
    .loading-progress {
      color: ${unsafeCSS(cssVar('textSecondaryColor'))};
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
      border: 2px solid ${unsafeCSS(cssVar('primaryColor'))};
      background: ${unsafeCSS(cssVar('blue50'))};
      color: ${unsafeCSS(cssVar('brandColor'))};
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
      font-size: ${unsafeCSS(cssVar('fontBase'))};
      height: 24px;
      line-height: 24px;
    }

    .loading-stage {
      font-size: ${unsafeCSS(cssVar('fontXs'))};
      height: 20px;
      line-height: 20px;
    }
  `;

  protected override render() {
    const theme = ThemeObserver.mode;
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
          ${theme === 'light' ? DarkLoadingIcon : LightLoadingIcon}
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
