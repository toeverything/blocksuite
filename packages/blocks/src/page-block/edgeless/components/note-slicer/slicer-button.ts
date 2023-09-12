import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { CutIcon } from '../../../../icons/index.js';

const buttonStyle = css`
  .slicer-button {
    display: flex;
    box-sizing: border-box;
    border-radius: 10px;
    padding: 5px;
    justify-content: center;
    align-items: center;
    color: var(--affine-icon-color);
    border: 1px solid var(--affine-border-color);
    background-color: var(--affine-hover-color-filled);
    cursor: pointer;
  }
`;

@customElement('note-slicer-button')
export class NoteSlicerButton extends WithDisposable(LitElement) {
  static override styles = [
    buttonStyle,
    css`
      .slicer-button {
        transform-origin: center center;
        transform: translate3d(-50%, 0, 0) scale(calc(1 / var(--affine-zoom)));
        transition: transform 0.1s ease-out;
      }
    `,
  ];

  @property({ attribute: false })
  zoom!: number;

  @query('.slicer-button')
  private _button!: HTMLButtonElement;

  private _externalButton: PopupNoteSlicerButton | null = null;

  private _createExternalButton() {
    if (this._externalButton) return this._externalButton;

    const externalButton = document.createElement(
      'affine-note-slicer-popupbutton'
    ) as PopupNoteSlicerButton;

    this._externalButton = externalButton;
    document.body.appendChild(externalButton);
    this._disposables.addFromEvent(
      externalButton,
      'click',
      this._dispatchSliceEvent
    );
    this._disposables.add(() => {
      document.body.removeChild(externalButton);
      this._externalButton = null;
    });

    return externalButton;
  }

  private _popupExternalButton = () => {
    this._dispatchPopupEvent();

    const externalButton = this._createExternalButton();

    requestAnimationFrame(() => {
      const rect = this._button.getBoundingClientRect();

      this._button.style.visibility = 'hidden';
      externalButton.show(rect);
      externalButton.addEventListener(
        'transitionend',
        () => {
          this._dispatchShowIndicatorEvent();
        },
        { once: true }
      );
    });
  };

  private _slideout() {
    const button = this._button;

    requestAnimationFrame(() => {
      button.style.transform = `translate3d(-${
        (0.5 + 1 / this.zoom) * 100
      }%, 0, 0) scale(calc(1 / var(--affine-zoom)))`;
    });

    button.addEventListener('transitionend', this._popupExternalButton, {
      once: true,
    });
  }

  private _dispatchShowIndicatorEvent() {
    const e = new CustomEvent('showindicator');

    this.dispatchEvent(e);
  }

  private _dispatchSliceEvent = () => {
    const e = new CustomEvent('slice');

    this.dispatchEvent(e);
  };

  private _dispatchPopupEvent = () => {
    const e = new CustomEvent('popup');

    this.dispatchEvent(e);
  };

  private _popup() {
    this._slideout();
  }

  reset() {
    this._button.removeEventListener(
      'transitionend',
      this._popupExternalButton
    );
    this._button.style.removeProperty('visibility');
    this._button.style.removeProperty('transform');
    this._externalButton?.reset();
  }

  override render() {
    return html`<button class="slicer-button" @mouseenter=${this._popup}>
      ${CutIcon}
    </button>`;
  }
}

@customElement('affine-note-slicer-popupbutton')
export class PopupNoteSlicerButton extends WithDisposable(LitElement) {
  static override styles = [
    buttonStyle,
    css`
      :host {
        display: none;
        position: absolute;
        left: 0;
        top: 0;
        z-index: calc(var(--affine-z-index-popover, 0) + 2);
        transform-origin: center center;
      }
    `,
  ];

  private _rafId = 0;

  show(rect: DOMRect) {
    this.style.display = 'block';
    this.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;

    const rafId = requestAnimationFrame(() => {
      this.style.transition = `transform 0.1s 0.1s ease-in-out`;
      this.style.transform = `translate3d(${rect.x + rect.width}px, ${
        rect.y
      }px, 0) scale(1.2)`;

      if (rafId === this._rafId) this._rafId = 0;
    });
    this._rafId = rafId;
  }

  reset() {
    this._rafId && cancelAnimationFrame(this._rafId);
    this.style.removeProperty('display');
    this.style.removeProperty('transform');
    this.style.removeProperty('transition');
  }

  override render() {
    return html`<button class="slicer-button">${CutIcon}</button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'note-slicer-button': NoteSlicerButton;
    'affine-note-slicer-popupbutton': PopupNoteSlicerButton;
  }
}
