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
  :host {
    position: absolute;
    top: 0;
    left: 0;

    max-width: 280px;
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    border-radius: 4px;
    padding: 6px 12px;
    color: var(--affine-white);
    background: var(--affine-tooltip);
  }

  .tooltip {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .arrow {
    position: absolute;

    width: 0;
    height: 0;
    border-style: solid;
    border-width: 5px 0 5px 6px;
    border-color: transparent transparent transparent var(--affine-tooltip);
  }
`;

@customElement('blocksuite-tooltip')
export class Tooltip extends LitElement {
  static override styles = css`
    :host {
      display: none;
    }
  `;

  @property({ attribute: 'tip-position' })
  placement?: Placement;

  @property({ attribute: true, type: Boolean })
  override hidden = false;

  // TODO
  @property({ attribute: false })
  noArrow = false;

  @property({ attribute: false })
  allowInteractive = false;

  private _hoverController = new HoverController(
    this,
    () => {
      if (this.hidden) return null;

      const slot = this.shadowRoot?.querySelector('slot');
      if (!slot) throw new Error('slot not found in tooltip!');
      const slottedChildren = slot
        .assignedNodes()
        .map(node => node.cloneNode(true));

      // Ported from https://floating-ui.com/docs/tutorial#arrow-middleware
      const updateArrowPosition = ({
        placement,
        middlewareData,
      }: ComputePositionReturn): StyleInfo => {
        // See http://apps.eky.hk/css-triangle-generator/
        const triangleStyles = {
          top: {
            bottom: '-6px',
            borderWidth: '6px 5px 0 5px',
            borderColor:
              'var(--affine-tooltip) transparent transparent transparent',
          },
          right: {
            left: '-6px',
            borderWidth: '5px 6px 5px 0',
            borderColor:
              'transparent var(--affine-tooltip) transparent transparent',
          },
          bottom: {
            top: '-6px',
            borderWidth: '0 5px 6px 5px',
            borderColor:
              'transparent transparent var(--affine-tooltip) transparent',
          },
          left: {
            right: '-6px',
            borderWidth: '5px 0 5px 6px',
            borderColor:
              'transparent transparent transparent var(--affine-tooltip)',
          },
        }[placement.split('-')[0]];

        const arrowX = middlewareData.arrow?.x;
        const arrowY = middlewareData.arrow?.y;

        return {
          left: arrowX != null ? `${arrowX}px` : '',
          top: arrowY != null ? `${arrowY}px` : '',
          right: '',
          bottom: '',
          ...triangleStyles,
        };
      };

      let arrowStyles: StyleInfo = {};
      return {
        template: ({ positionSlot, updatePortal }) => {
          positionSlot.on(data => {
            arrowStyles = updateArrowPosition(data);
            updatePortal();
          });
          return html`
            <style>
              ${styles}
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
            flip(),
            offset(10),
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
    this._hoverController.setReference(parent);
  }

  // private _handleSlotchange(e: Event) {
  // console.warn('Dynamic tooltip is not supported yet!');
  // TODO update tooltip
  // }

  override render() {
    // The actual tooltip render as a portal, so we only need to render the slot
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'blocksuite-tooltip': Tooltip;
  }
}
