import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('note-slicer-indicator')
export class NoteSlicerIndicator extends WithDisposable(LitElement) {
  @property({ attribute: false })
  width!: number;

  @property({ attribute: false })
  offset!: number;

  static override styles = css`
    :host {
      visibility: hidden;
      z-index: 1;
      width: 0px;
      transition: width 0.1s ease-in-out;
      transform: scale(1 / var(--affine-zoom));
      transform-origin: left center;
    }

    .indicator-line {
      height: 2px;
      box-shadow: 0px 4px 11px #3ab4f7;
      border-radius: 1px;
      background-color: var(--affine-blue-500);
    }
  `;

  show() {
    requestAnimationFrame(() => {
      this.style.visibility = 'visible';

      requestAnimationFrame(() => {
        this.style.transform = `translate(${this.offset}px, 0)`;
        this.style.width = `${this.width}px`;
      });
    });
  }

  reset() {
    this.style.removeProperty('visibility');
    this.style.removeProperty('transform');
    this.style.removeProperty('width');
  }

  override render() {
    return html` <div class="indicator-line"></div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'note-slicer-indicator': NoteSlicerIndicator;
  }
}
