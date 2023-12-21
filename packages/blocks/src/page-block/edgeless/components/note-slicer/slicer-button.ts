import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { CutIcon } from '../../../../_common/icons/index.js';
import { requestConnectedFrame } from '../../../../_common/utils/event.js';

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
        transition: transform 0.12s ease-in-out;
      }
    `,
  ];

  @property({ attribute: false })
  zoom!: number;

  @query('.slicer-button')
  private _button!: HTMLButtonElement;

  private _popButton!: PopupNoteSlicerButton;

  private _active: boolean = false;

  private get _defaultTransform() {
    return `translate3d(-50%, 0, 0)`;
  }

  private _getPopupButton() {
    if (!this._popButton) {
      this._popButton = new PopupNoteSlicerButton();
      this._popButton.addEventListener(
        'click',
        () => {
          this._dispatchSliceEvent();
        },
        false
      );
    }

    return this._popButton;
  }

  private _slideout() {
    if (this._active) return;

    this._active = true;

    const button = this._button;

    requestConnectedFrame(() => {
      button.style.transform = `translate3d(-${150}%, 0, 0)`;
    }, this);

    button.addEventListener(
      'transitionend',
      () => {
        requestConnectedFrame(() => {
          button.style.transform = `translate3d(-50%, 0, 0) scale(${1.3})`;
        }, this);

        this._increaseZIndex();
        button.addEventListener(
          'transitionend',
          () => {
            const rect = this._button.getBoundingClientRect();

            this._getPopupButton().show(rect, 1.3);
            this._dispatchShowIndicatorEvent();
          },
          { once: true }
        );
      },
      { once: true }
    );
  }

  private _increaseZIndex() {
    const e = new CustomEvent('increasezindex');

    this.dispatchEvent(e);
  }

  private _dispatchShowIndicatorEvent() {
    const e = new CustomEvent('showindicator');

    this.dispatchEvent(e);
  }

  private _dispatchSliceEvent = () => {
    const e = new CustomEvent('slice');

    this.dispatchEvent(e);
  };

  reset() {
    this._active = false;
    this._button.style.removeProperty('visibility');
    this._button.style.transform = this._defaultTransform;
    this._popButton?.reset();
  }

  override render() {
    return html`<button
      class="slicer-button"
      style=${styleMap({
        transform: this._defaultTransform,
      })}
      @mouseenter=${this._slideout}
      @click=${this._dispatchSliceEvent}
    >
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
        transform-origin: left top;
      }
    `,
  ];

  show(rect: DOMRect, scale: number) {
    document.body.appendChild(this);

    this.style.display = 'block';
    this.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0) scale(${scale})`;
  }

  reset() {
    this.remove();
    this.style.removeProperty('display');
    this.style.removeProperty('transform');
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
