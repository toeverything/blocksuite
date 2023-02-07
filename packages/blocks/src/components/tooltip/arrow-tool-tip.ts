import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

@customElement('arrow-tool-tip')
class ArrowToolTip extends LitElement {
  @property()
  tipText = '';

  /**
   * need to be positioned by its consumer.
   * 1. Can append css to its :host, an example can be:
   * arrow-tool-tip {
   *   transform: translateX(-50%) translateY(-50%);
   *   left: calc(50%);
   *   bottom: calc(-50%);
   *   opacity: 0;
   * }
   * 2. use createPopper() in popper.js to deal with position
   */
  static styles = css`
    :host {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: var(--affine-font-family);
      font-size: calc(var(--affine-font-sm) - 2px);
      line-height: calc(var(--affine-line-height-base) - 4px);
      pointer-events: none;
      user-select: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .rect {
      padding: 0 12px;
      height: 32px;
      background: var(--affine-tooltip-background);
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      white-space: pre;
      color: var(--affine-page-background);
    }

    .arrow {
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 6px solid var(--affine-tooltip-background);
    }
  `;

  render() {
    return html`
      <div class="rect">${this.tipText}</div>
      <div class="arrow"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'arrow-tool-tip': ArrowToolTip;
  }
}
