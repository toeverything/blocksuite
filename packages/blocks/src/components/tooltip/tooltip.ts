import { assertExists } from '@blocksuite/global/utils';
import {
  arrow,
  type ComputePositionReturn,
  flip,
  offset,
  type Placement,
} from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import { HoverController } from '../when-hover.js';

/**
 * @example
 * ```html
 * <icon-button class="has-tool-tip" style="${tooltipStyle}">
 *    Button
 *    <tool-tip inert role="tooltip">Tooltip</tool-tip>
 * </icon-button>
 * ```
 * Reference to https://web.dev/building-a-tooltip-component/
 */
export const tooltipStyle = css``;

const styles = css`
  .tooltip {
    max-width: 280px;
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    border-radius: 4px;
    padding: 6px 12px;
    color: var(--affine-white);
    background: var(--affine-tooltip);

    display: flex;
    justify-content: center;
    align-items: center;
  }

  .arrow {
    position: absolute;

    width: 0;
    height: 0;
  }
`;

// See http://apps.eky.hk/css-triangle-generator/
const triangleMap = {
  top: {
    bottom: '-6px',
    borderStyle: 'solid',
    borderWidth: '6px 5px 0 5px',
    borderColor: 'var(--affine-tooltip) transparent transparent transparent',
  },
  right: {
    left: '-6px',
    borderStyle: 'solid',
    borderWidth: '5px 6px 5px 0',
    borderColor: 'transparent var(--affine-tooltip) transparent transparent',
  },
  bottom: {
    top: '-6px',
    borderStyle: 'solid',
    borderWidth: '0 5px 6px 5px',
    borderColor: 'transparent transparent var(--affine-tooltip) transparent',
  },
  left: {
    right: '-6px',
    borderStyle: 'solid',
    borderWidth: '5px 0 5px 6px',
    borderColor: 'transparent transparent transparent var(--affine-tooltip)',
  },
};

// Ported from https://floating-ui.com/docs/tutorial#arrow-middleware
const updateArrowStyles = ({
  placement,
  middlewareData,
}: ComputePositionReturn): StyleInfo => {
  const arrowX = middlewareData.arrow?.x;
  const arrowY = middlewareData.arrow?.y;

  const triangleStyles =
    triangleMap[placement.split('-')[0] as keyof typeof triangleMap];

  return {
    left: arrowX != null ? `${arrowX}px` : '',
    top: arrowY != null ? `${arrowY}px` : '',
    ...triangleStyles,
  };
};

// TODO migrate to `blocksuite-tooltip`
// @customElement('blocksuite-tooltip')
@customElement('tool-tip')
export class Tooltip extends LitElement {
  static override styles = css`
    :host {
      display: none;
    }
  `;

  @property({ attribute: 'tip-position' })
  placement?: Placement;

  /**
   * changes the placement of the floating element in order to keep it in view,
   * with the ability to flip to any placement.
   *
   * See https://floating-ui.com/docs/flip
   */
  @property({ attribute: false, type: Boolean })
  autoFlip = true;

  /**
   * Show a triangle arrow pointing to the reference element.
   */
  @property({ attribute: false })
  arrow = true;

  /**
   * See https://floating-ui.com/docs/offset
   */
  @property({ attribute: false })
  offset = 10;

  /**
   * Allow the tooltip to be interactive.
   * eg. allow the user to select text in the tooltip.
   */
  @property({ attribute: false })
  allowInteractive = false;

  private _hoverController = new HoverController(
    this,
    () => {
      // const parentElement = this.parentElement;
      // if (
      //   parentElement &&
      //   'disabled' in parentElement &&
      //   parentElement.disabled
      // )
      //   return null;
      if (this.hidden) return null;
      let arrowStyles: StyleInfo = {};
      return {
        template: ({ positionSlot, updatePortal }) => {
          positionSlot.on(data => {
            // The tooltip placement may change,
            // so we need to update the arrow position
            if (this.arrow) {
              arrowStyles = updateArrowStyles(data);
            } else {
              arrowStyles = {};
            }
            updatePortal();
          });

          const slot = this.shadowRoot?.querySelector('slot');
          if (!slot) throw new Error('slot not found in tooltip!');
          // slot.addEventListener('slotchange', () => updatePortal, {
          //   once: true,
          // });
          const slottedChildren = slot
            .assignedNodes()
            .map(node => node.cloneNode(true));
          return html`
            <style>
              ${styles}
              .tooltip {
                ${
                // All the styles are applied to the tooltip element
                this.style.cssText
              }
              }
              ${this.allowInteractive
                ? null
                : css`
                    :host {
                      pointer-events: none;
                    }
                  `}
            </style>
            <div class="tooltip">${slottedChildren}</div>
            <div class="arrow" style=${styleMap(arrowStyles)}></div>
          `;
        },
        computePosition: portalRoot => ({
          referenceElement: this.parentElement!,
          placement: this.placement || 'top',
          middleware: [
            this.autoFlip && flip(),
            offset(this.offset),
            arrow({
              element: portalRoot.shadowRoot!.querySelector('.arrow')!,
            }),
          ],
          autoUpdate: true,
        }),
      };
    },
    { leaveDelay: 0 }
  );

  override connectedCallback() {
    super.connectedCallback();
    const parent = this.parentElement;
    assertExists(parent, 'Tooltip must have a parent element');

    // Wait for render
    setTimeout(() => {
      this._hoverController.setReference(parent);
    }, 0);
  }

  getPortal() {
    return this._hoverController.portal;
  }

  override render() {
    // The actual tooltip render as a portal, so we only need to render the slot
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tool-tip': Tooltip;
  }
}
