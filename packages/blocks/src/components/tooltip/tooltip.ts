import { assertExists } from '@blocksuite/global/utils';
import {
  arrow,
  type ComputePositionReturn,
  flip,
  offset,
  type Placement,
} from '@floating-ui/dom';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, unsafeCSS } from 'lit';
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
export const tooltipStyle = css`
  tool-tip {
    --affine-tooltip-offset: 8px;
    --affine-tooltip-round: 4px;
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    position: absolute;
    inline-size: max-content;
    text-align: center;
    font-size: var(--affine-font-sm);
    padding: 5px 12px;
    color: var(--affine-white);
    background: var(--affine-tooltip);
    opacity: 0;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
    pointer-events: none;
    user-select: none;

    /* Default is top-start */
    left: 0;
    top: 0;
    border-radius: var(--affine-tooltip-round);
    transform: translate(0, calc(-100% - var(--affine-tooltip-offset)));
  }
  tool-tip:is([tip-position='top']) {
    left: 50%;
    border-radius: var(--affine-tooltip-round);
    transform: translate(-50%, calc(-100% - var(--affine-tooltip-offset)));
  }
  tool-tip:is([tip-position='right']) {
    left: unset;
    right: 0;
    transform: translateX(calc(100% + var(--affine-tooltip-offset)));
  }
  tool-tip:is([tip-position='right']):not(:is([arrow])) {
    border-top-left-radius: 0;
  }
  tool-tip:is([tip-position='left']) {
    left: 0;
    top: 50%;
    transform: translate(calc(-100% - var(--affine-tooltip-offset)), -50%);
  }
  tool-tip:is([tip-position='bottom']) {
    top: unset;
    left: 50%;
    bottom: 0;
    transform: translate(-50%, calc(100% + var(--affine-tooltip-offset)));
  }

  /** basic triangle style */
  tool-tip:is([arrow])::before {
    position: absolute;
    content: '';
    background: var(--affine-tooltip);
    width: 10px;
    height: 10px;
    border-radius: 2px;
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%);
  }

  /* work for tip-position='top' */
  tool-tip:is([arrow]):is([tip-position='top']) {
    transform: translate(-50%, calc(-100% - var(--affine-tooltip-offset) * 2));
  }
  tool-tip:is([arrow]):is([tip-position='top'])::before {
    left: 50%;
    bottom: 0;
    transform: translate(-50%, 40%) scaleX(0.8) rotate(135deg);
  }

  /* work for tip-position='right' */
  tool-tip:is([arrow]):is([tip-position='right']) {
    transform: translateX(calc(100% + var(--affine-tooltip-offset) * 2));
  }
  tool-tip:is([arrow]):is([tip-position='right'])::before {
    left: 0;
    bottom: 50%;
    transform: translate(-40%, 50%) scaleY(0.8) rotate(-135deg);
  }

  /* work for tip-position='left' */
  tool-tip:is([arrow]):is([tip-position='left']) {
    transform: translate(calc(-100% - var(--affine-tooltip-offset) * 2), -50%);
  }
  tool-tip:is([arrow]):is([tip-position='left'])::before {
    right: 0;
    bottom: 50%;
    transform: translate(40%, 50%) scaleY(0.8) rotate(45deg);
  }

  /* work for tip-position='bottom' */
  tool-tip:is([arrow]):is([tip-position='bottom']) {
    transform: translate(-50%, calc(100% + var(--affine-tooltip-offset) * 2));
  }
  tool-tip:is([arrow]):is([tip-position='bottom'])::before {
    left: 50%;
    bottom: 100%;
    transform: translate(-50%, 60%) scaleX(0.8) rotate(-45deg);
  }

  /* work for tip-position='top-end' */
  tool-tip:is([arrow]):is([tip-position='top-end']) {
    transform: translate(-15%, calc(-100% - var(--affine-tooltip-offset) * 2));
  }
  tool-tip:is([arrow]):is([tip-position='top-end'])::before {
    left: 30%;
    bottom: 0;
    transform: translate(-50%, 40%) scaleX(0.8) rotate(135deg);
  }
  /* work for tip-position='top-start' */
  tool-tip:is([arrow]):is([tip-position='top-start']) {
    transform: translate(-75%, calc(-100% - var(--affine-tooltip-offset) * 2));
  }
  tool-tip:is([arrow]):is([tip-position='top-start'])::before {
    right: 5%;
    bottom: 0;
    transform: translate(-50%, 40%) scaleX(0.8) rotate(135deg);
  }
  .has-tool-tip {
    position: relative;
  }
  .has-tool-tip:is(:hover, :focus-visible, :active) > tool-tip {
    opacity: 1;
    transition-delay: 200ms;
  }
  /** style for shortcut tooltip */
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
`;

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

  private _handleSlotchange(e: Event) {
    // console.warn('Dynamic tooltip is not supported yet!');
    // TODO update tooltip
  }

  override render() {
    // The actual tooltip render as a portal, so we only need to render the slot
    return html`<slot @slotchange=${this._handleSlotchange}></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'blocksuite-tooltip': Tooltip;
  }
}
