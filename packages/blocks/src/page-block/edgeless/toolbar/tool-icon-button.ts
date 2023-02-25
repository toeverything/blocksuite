import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('edgeless-tool-icon-button')
export class EdgelessToolIconButton extends LitElement {
  static styles = css`
    .icon-container {
      position: relative;
      display: flex;
      align-items: center;
      padding: 4px;
      color: var(--affine-line-number-color);
      margin-right: 8px;
      margin-top: 8px;
      margin-bottom: 8px;
      border-radius: 5px;
      cursor: pointer;
    }

    .icon-container:first-child {
      margin-left: 8px;
    }

    .icon-container:hover {
      background: #f7f7f7;
    }

    .icon-container[active] {
      color: var(--affine-primary-color);
    }

    .icon-container[disabled] {
      cursor: not-allowed;
      color: var(--affine-disable-color);
    }

    arrow-tool-tip {
      transform: translateX(-50%) translateY(-50%);
      left: calc(50%);
      bottom: 24px;
      opacity: 0;
    }

    .icon-container:hover > arrow-tool-tip {
      opacity: 1;
      transition-delay: 200ms;
    }
  `;

  @property()
  disabled = false;

  @property()
  tooltip!: string;

  @property()
  active = false;

  @property()
  testId?: string;

  private _dispatchClickEvent() {
    if (this.disabled) return;

    this.dispatchEvent(
      new CustomEvent<void>('tool.click', {
        composed: true,
        bubbles: true,
      })
    );
  }

  render() {
    const tooltip = this.disabled ? '(Coming soon)' : this.tooltip;
    return html`
      <div
        class="icon-container"
        role="button"
        ?disabled=${this.disabled}
        ?active=${this.active}
        data-test-id=${this.testId ?? ''}
        @click=${this._dispatchClickEvent}
      >
        <slot></slot>
        ${tooltip
          ? html` <arrow-tool-tip .tipText=${tooltip}></arrow-tool-tip> `
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-tool-icon-button': EdgelessToolIconButton;
  }
}
