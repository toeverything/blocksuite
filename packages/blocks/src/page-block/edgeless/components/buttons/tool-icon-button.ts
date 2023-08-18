import type { TemplateResult } from 'lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { tooltipStyle } from '../../../../components/tooltip/tooltip.js';

@customElement('edgeless-tool-icon-button')
export class EdgelessToolIconButton extends LitElement {
  static override styles = css`
    .icon-container {
      position: relative;
      display: flex;
      align-items: center;
      padding: var(--icon-container-padding);
      color: var(--affine-icon-color);
      border-radius: 4px;
      cursor: pointer;
    }

    .icon-container:hover {
      background: var(--affine-hover-color);
    }

    .icon-container.active-mode-color[active] {
      color: var(--affine-primary-color);
    }

    .icon-container.active-mode-background[active] {
      background: var(--affine-hover-color);
    }

    .icon-container[disabled] {
      pointer-events: none;
      cursor: not-allowed;
    }

    .icon-container[coming] {
      cursor: not-allowed;
      color: var(--affine-text-disable-color);
    }

    ${tooltipStyle}

    tool-tip {
      z-index: 12;
    }

    tool-tip:is([arrow]):is([tip-position='top'])::before {
      margin-top: -4px;
    }
  `;

  @property({ attribute: false })
  disabled = false;

  @property({ attribute: false })
  coming = false;

  @property({ attribute: false })
  tooltip!: string | TemplateResult<1>;

  @property({ attribute: false })
  tipPosition: 'top' | 'bottom' | 'left' | 'right' | 'top-end' = 'top';

  @property({ attribute: false })
  arrow = true;

  @property({ attribute: false })
  active = false;

  @property({ attribute: false })
  activeMode: 'color' | 'background' = 'color';

  @property({ attribute: false })
  iconContainerPadding = 6;

  constructor() {
    super();

    this.addEventListener(
      'click',
      event => {
        if (this.disabled) {
          event.stopPropagation();
          event.preventDefault();
        }
      },
      { capture: true }
    );
  }

  override render() {
    const tooltip = this.coming ? '(Coming soon)' : this.tooltip;
    const classnames = `icon-container has-tool-tip active-mode-${this.activeMode}`;
    const iconContainerStyles = styleMap({
      '--icon-container-padding': `${this.iconContainerPadding}px`,
    });

    return html`
      <div
        class=${classnames}
        style=${iconContainerStyles}
        role="button"
        ?disabled=${this.disabled}
        ?active=${this.active}
      >
        <slot></slot>
        ${tooltip
          ? html`<tool-tip
              inert
              role="tooltip"
              tip-position=${this.tipPosition}
              ?arrow=${this.arrow}
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
