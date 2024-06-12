import { assertExists } from '@blocksuite/global/utils';
import {
  arrow,
  type ComputePositionReturn,
  flip,
  offset,
  type Placement,
} from '@floating-ui/dom';
import type { CSSResult } from 'lit';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import type { HoverOptions } from '../hover/controller.js';
import { HoverController } from '../hover/index.js';

const styles = css`
  .affine-tooltip {
    box-sizing: border-box;
    max-width: 280px;
    min-height: 32px;
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
const TRIANGLE_HEIGHT = 6;
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

/**
 * @example
 * ```ts
 * // Simple usage
 * html`
 * <affine-tooltip>Content</affine-tooltip>
 * `
 * // With placement
 * html`
 * <affine-tooltip tip-position="top">
 *   Content
 * </affine-tooltip>
 * `
 *
 * // With custom properties
 * html`
 * <affine-tooltip
 *   .zIndex=${0}
 *   .offset=${4}
 *   .autoFlip=${true}
 *   .arrow=${true}
 *   .tooltipStyle=${css`:host { z-index: 0; --affine-tooltip: #fff; }`}
 *   .allowInteractive=${false}
 * >
 *   Content
 * </affine-tooltip>
 * `
 * ```
 */
@customElement('affine-tooltip')
export class Tooltip extends LitElement {
  static override styles = css`
    :host {
      display: none;
    }
  `;

  private _hoverController!: HoverController;

  @property({ attribute: 'tip-position' })
  accessor placement: Placement = 'top';

  @property({ attribute: false })
  accessor zIndex: number | string = 'var(--affine-z-index-popover)';

  @property({ attribute: false })
  accessor tooltipStyle: CSSResult = css``;

  /**
   * changes the placement of the floating element in order to keep it in view,
   * with the ability to flip to any placement.
   *
   * See https://floating-ui.com/docs/flip
   */
  @property({ attribute: false })
  accessor autoFlip = true;

  /**
   * Show a triangle arrow pointing to the reference element.
   */
  @property({ attribute: false })
  accessor arrow = true;

  /**
   * Default is `4px`
   *
   * See https://floating-ui.com/docs/offset
   */
  @property({ attribute: false })
  accessor offset = 4;

  /**
   * Allow the tooltip to be interactive.
   * eg. allow the user to select text in the tooltip.
   */
  @property({ attribute: false })
  accessor allowInteractive = false;

  @property({ attribute: false })
  accessor hoverOptions: Partial<HoverOptions> = {};

  private _setUpHoverController = () => {
    this._hoverController = new HoverController(
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

            const children = Array.from(this.childNodes).map(node =>
              node.cloneNode(true)
            );

            return html`
              <style>
                ${this._getStyles()}
              </style>
              <div class="affine-tooltip" role="tooltip">${children}</div>
              <div class="arrow" style=${styleMap(arrowStyles)}></div>
            `;
          },
          computePosition: portalRoot => ({
            referenceElement: this.parentElement!,
            placement: this.placement,
            middleware: [
              this.autoFlip && flip({ padding: 12 }),
              offset((this.arrow ? TRIANGLE_HEIGHT : 0) + this.offset),
              arrow({
                element: portalRoot.shadowRoot!.querySelector('.arrow')!,
              }),
            ],
            autoUpdate: true,
          }),
        };
      },
      {
        leaveDelay: 0,
        // The tooltip is not interactive by default
        safeBridge: false,
        allowMultiple: true,
        ...this.hoverOptions,
      }
    );

    const parent = this.parentElement;
    assertExists(parent, 'Tooltip must have a parent element');

    // Wait for render
    setTimeout(() => {
      this._hoverController.setReference(parent);
    }, 0);
  };

  private _getStyles() {
    return css`
      ${styles}
      :host {
        z-index: ${unsafeCSS(this.zIndex)};
        opacity: 0;
        ${
          // All the styles are applied to the portal element
          unsafeCSS(this.style.cssText)
        }
      }

      ${this.allowInteractive
        ? css``
        : css`
            :host {
              pointer-events: none;
            }
          `}

      ${this.tooltipStyle}
    `;
  }

  override connectedCallback() {
    super.connectedCallback();

    this._setUpHoverController();
  }

  getPortal() {
    return this._hoverController.portal;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-tooltip': Tooltip;
  }
}
