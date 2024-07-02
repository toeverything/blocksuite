import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('affine-toolbar')
export class AffineToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 8px;
      width: max-content;
      height: 36px;
      padding: 0 6px;
      box-sizing: content-box;
      border-radius: 4px;
      border: 0.5px solid var(--affine-border-color);
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-4);

      color: var(--affine-icon-color);
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      font-feature-settings:
        'clig' off,
        'liga' off;
      font-size: var(--affine-font-sm);
      font-style: normal;
      font-weight: 500;
      line-height: 22px;
    }
  `;

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-toolbar': AffineToolbar;
  }
}
