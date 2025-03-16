import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

export class TooltipContentWithShortcut extends LitElement {
  static override styles = css`
    .tooltip-with-shortcut {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      gap: 10px;
    }
    .tooltip__shortcut {
      font-size: 12px;
      position: relative;

      display: flex;
      align-items: center;
      justify-content: center;
      height: 16px;
      min-width: 16px;
    }
    .tooltip__shortcut::before {
      content: '';
      border-radius: 4px;
      position: absolute;
      inset: 0;
      background: currentColor;
      opacity: 0.2;
    }
    .tooltip__label {
      white-space: pre;
    }
  `;

  override render() {
    const { tip, shortcut, postfix } = this;

    return html`
      <div class="tooltip-with-shortcut">
        <span class="tooltip__label">${tip}</span>
        ${shortcut
          ? html`<span class="tooltip__shortcut">${shortcut}</span>`
          : ''}
        ${postfix ? html`<span class="tooltip__postfix">${postfix}</span>` : ''}
      </div>
    `;
  }

  @property({ attribute: 'data-tip' })
  accessor tip!: string;

  @property({ attribute: 'data-shortcut' })
  accessor shortcut: string | undefined = undefined;

  @property({ attribute: 'data-postfix' })
  accessor postfix: string | undefined = undefined;
}

export function effects() {
  customElements.define(
    'affine-tooltip-content-with-shortcut',
    TooltipContentWithShortcut
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-tooltip-content-with-shortcut': TooltipContentWithShortcut;
  }
}
