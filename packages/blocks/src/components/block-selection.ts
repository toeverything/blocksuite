import { css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * Renders a the block selection.
 *
 * @example
 * ```ts
 * class Block extends LitElement {
 *   state override styles = css`
 *     :host {
 *       position: relative;
 *     }
 *   `
 *   render() {
 *     return html`${this.selected?.is('block')
 *       ? html`<affine-block-selection></affine-block-selection>`
 *       : null}`;
 *   };
 * }
 * ```
 */
@customElement('affine-block-selection')
export class BlockSelection extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      background-color: var(--affine-hover-color);
      border-radius: 5px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-block-selection': BlockSelection;
  }
}
