import type { Placement } from '@floating-ui/dom';
import type { TemplateResult } from 'lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

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
      white-space: nowrap;
    }

    .icon-container.active-mode-color[active] {
      color: var(--affine-primary-color);
    }

    .icon-container.active-mode-background[active] {
      background: var(--affine-hover-color);
    }

    .icon-container > svg {
      flex-shrink: 0;
    }

    .icon-container[disabled] {
      pointer-events: none;
      cursor: not-allowed;
      color: var(--affine-text-disable-color);
    }

    .icon-container[coming] {
      cursor: not-allowed;
      color: var(--affine-text-disable-color);
    }
  `;

  @property({ attribute: false })
  disabled = false;

  @property({ attribute: false })
  coming = false;

  @property({ attribute: false })
  tooltip!: string | TemplateResult<1>;

  @property({ attribute: false })
  tipPosition: Placement = 'top';

  @property({ attribute: false })
  arrow = true;

  @property({ attribute: false })
  tooltipOffset = 8;

  @property({ attribute: false })
  active = false;

  @property({ attribute: false })
  activeMode: 'color' | 'background' = 'color';

  @property({ attribute: false })
  iconContainerPadding = 6;

  @property({ attribute: false })
  hover = true;

  @property({ attribute: false })
  hoverState = false;

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
    const classnames = `icon-container active-mode-${this.activeMode} ${this.hoverState ? 'hovered' : ''}`;
    const iconContainerStyles = styleMap({
      '--icon-container-padding': `${this.iconContainerPadding}px`,
    });

    return html`
      <style>
        .icon-container:hover,
        .icon-container.hovered {
          background: ${this.hover ? `var(--affine-hover-color)` : 'inherit'};
        }
      </style>
      <div
        class=${classnames}
        style=${iconContainerStyles}
        role="button"
        ?disabled=${this.disabled}
        ?active=${this.active}
      >
        <slot></slot>
        ${tooltip
          ? html`<affine-tooltip
              tip-position=${this.tipPosition}
              .arrow=${this.arrow}
              .offset=${this.tooltipOffset}
              >${tooltip}</affine-tooltip
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
