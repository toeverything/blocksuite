import { css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

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
      border-color: transparent;
      border-style: solid;
    }
  `;

  @property({ attribute: false })
  borderRadius?: number = 5;

  @property({ attribute: false })
  borderWidth?: number = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this.style.borderRadius = `${this.borderRadius}px`;
    if (this.borderWidth !== 0) {
      this.style.boxSizing = 'content-box';
      this.style.transform = `translate(-${this.borderWidth}px, -${this.borderWidth}px)`;
    }
    this.style.borderWidth = `${this.borderWidth}px`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-block-selection': BlockSelection;
  }
}
