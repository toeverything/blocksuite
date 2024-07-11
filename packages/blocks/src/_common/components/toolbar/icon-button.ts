import '../tooltip/tooltip.js';

import type { Placement } from '@floating-ui/dom';
import type { TemplateResult } from 'lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { styleMap } from 'lit/directives/style-map.js';

@customElement('editor-icon-button')
export class EditorIconButton extends LitElement {
  static override styles = css`
    :host([disabled]),
    :host(:disabled) {
      pointer-events: none;
      cursor: not-allowed;
      color: var(--affine-text-disable-color);
    }

    .icon-container {
      position: relative;
      display: flex;
      align-items: center;
      padding: var(--icon-container-padding);
      color: var(--affine-icon-color);
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
      box-sizing: border-box;
      width: var(--icon-container-width, unset);
      justify-content: var(--justify, unset);
      user-select: none;
    }

    :host([active]) .icon-container.active-mode-color {
      color: var(--affine-primary-color);
    }

    :host([active]) .icon-container.active-mode-background {
      background: var(--affine-hover-color);
    }

    .icon-container[coming] {
      cursor: not-allowed;
      color: var(--affine-text-disable-color);
    }

    ::slotted(svg) {
      flex-shrink: 0;
      width: var(--icon-size, unset);
      height: var(--icon-size, unset);
    }

    ::slotted(.label) {
      flex: 1;
      padding: 0 4px;
      overflow: hidden;
      white-space: nowrap;
      line-height: var(--label-height, inherit);
    }
    ::slotted(.label.padding0) {
      padding: 0;
    }
    ::slotted(.label.ellipsis) {
      text-overflow: ellipsis;
    }
    ::slotted(.label.medium) {
      font-weight: 500;
    }

    .icon-container[with-hover]::before {
      content: '';
      display: block;
      background: var(--affine-hover-color);
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      border-radius: 4px;
    }
  `;

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  @property({ attribute: false })
  accessor coming = false;

  @property({ type: Boolean })
  accessor showTooltip = true;

  @property({ attribute: false })
  accessor tooltip!: string | TemplateResult<1>;

  @property({ attribute: false })
  accessor tipPosition: Placement = 'top';

  @property({ attribute: false })
  accessor arrow = true;

  @property({ attribute: false })
  accessor tooltipOffset = 8;

  @property({ attribute: false })
  accessor active = false;

  @property({ attribute: false })
  accessor activeMode: 'color' | 'background' = 'color';

  @property({ attribute: false })
  accessor iconContainerWidth: string | undefined = undefined;

  @property({ attribute: false })
  accessor iconContainerPadding: number | number[] = 2;

  @property({ attribute: false })
  accessor iconSize: string | undefined = undefined;

  @property({ attribute: false })
  accessor labelHeight: string | undefined = undefined;

  @property({ attribute: false })
  accessor withHover: boolean | undefined = undefined;

  @property({ attribute: false })
  accessor justify: string | undefined = undefined;

  @property({ attribute: false })
  accessor hover = true;

  @property({ attribute: false })
  accessor hoverState = false;

  constructor() {
    super();

    // Allow activate button by pressing Enter key
    this.addEventListener('keypress', event => {
      if (this.disabled) {
        return;
      }
      if (event.key === 'Enter' && !event.isComposing) {
        this.click();
      }
    });

    // Prevent click event when disabled
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

  override connectedCallback() {
    super.connectedCallback();
    this.tabIndex = 0;
    this.role = 'button';
  }

  override render() {
    const tooltip = this.coming ? '(Coming soon)' : this.tooltip;
    const classnames = `icon-container active-mode-${this.activeMode} ${this.hoverState ? 'hovered' : ''}`;
    const padding = this.iconContainerPadding;
    const iconContainerStyles = styleMap({
      '--icon-container-width': this.iconContainerWidth,
      '--icon-container-padding': Array.isArray(padding)
        ? padding.map(v => `${v}px`).join(' ')
        : `${padding}px`,
      '--icon-size': this.iconSize,
      '--justify': this.justify,
      '--label-height': this.labelHeight,
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
        ?with-hover=${this.withHover}
        ?disabled=${this.disabled}
        ?active=${this.active}
      >
        <slot></slot>
        ${cache(
          this.showTooltip && tooltip
            ? html`<affine-tooltip
                tip-position=${this.tipPosition}
                .arrow=${this.arrow}
                .offset=${this.tooltipOffset}
                >${tooltip}</affine-tooltip
              >`
            : nothing
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-icon-button': EditorIconButton;
  }
}
