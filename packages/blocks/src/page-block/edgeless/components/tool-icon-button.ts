import type { TemplateResult } from 'lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { tooltipStyle } from '../../../components/tooltip/tooltip.js';

@customElement('edgeless-tool-icon-button')
export class EdgelessToolIconButton extends LitElement {
  static styles = css`
    .icon-container {
      position: relative;
      display: flex;
      align-items: center;
      padding: 4px;
      color: var(--affine-text-secondary-color);
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
      color: var(--affine-text-disable-color);
    }

    ${tooltipStyle}
  `;

  @property()
  disabled = false;

  @property()
  tooltip!: string | TemplateResult<1>;

  @property()
  active = false;

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
        class="icon-container has-tool-tip"
        role="button"
        ?disabled=${this.disabled}
        ?active=${this.active}
        @click=${this._dispatchClickEvent}
      >
        <slot></slot>
        ${tooltip
          ? html`<tool-tip inert role="tooltip" tip-position="top" arrow
              >${tooltip}</tool-tip
            >`
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
