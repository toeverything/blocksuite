import { CutIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, query } from 'lit/decorators.js';

const buttonStyle = css`
  .scissors-button {
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

@customElement('note-scissors-button')
export class NoteScissorsVisualButton extends WithDisposable(LitElement) {
  static override styles = [
    buttonStyle,
    css`
      .scissors-button {
        transform: translate3d(-50%, 0, 0);
        transition: transform 0.2s ease-out;
      }

      .scissors-button.slideout {
        transform: translate3d(-150%, 0, 0) translate3d(3px, 0, 0);
      }
    `,
  ];

  @query('.scissors-button')
  private _button!: HTMLButtonElement;

  private _externalButton: null | NoteScissorsButton = null;

  private _zoom = 1;

  private _createExternalButton() {
    const externalButton = document.createElement(
      'affine-note-scissors'
    ) as NoteScissorsButton;

    document.body.appendChild(externalButton);
    this._externalButton = externalButton;
    this._disposables.addFromEvent(
      this._externalButton,
      'click',
      this._dispatchClipEvent
    );
    this._disposables.add(() => {
      document.body.removeChild(externalButton);
      this._externalButton = null;
    });
  }

  private _popupButton = () => {
    if (!this._externalButton) return;

    const button = this._externalButton;

    requestAnimationFrame(() => {
      const rect = this._button.getBoundingClientRect();

      this._button.style.visibility = 'hidden';
      button.show(rect, this._zoom);
      button.addEventListener(
        'transitionend',
        () => {
          this._dispatchIndicatorEvent();
        },
        { once: true }
      );
    });
  };

  private _dispatchEnterButtonEvent() {
    const e = new CustomEvent('mouseenterbutton');

    this.dispatchEvent(e);
  }

  private _dispatchIndicatorEvent() {
    const e = new CustomEvent('showindicator');

    this.dispatchEvent(e);
  }

  private _dispatchClipEvent = () => {
    const e = new CustomEvent('clip');

    this.dispatchEvent(e);
  };

  protected override firstUpdated(): void {
    if (!this._externalButton) {
      this._createExternalButton();
    }
  }

  show(zoom: number) {
    this._zoom = zoom;

    this._button.addEventListener('transitionend', this._popupButton, {
      once: true,
    });
    this._button.classList.add('slideout');
  }

  reset() {
    this._button.removeEventListener('transitionend', this._popupButton);
    this._button.classList.remove('slideout');
    this._button.style.removeProperty('visibility');
    this._externalButton?.reset();
  }

  override render() {
    return html`<button
      class="scissors-button"
      @mouseenter=${this._dispatchEnterButtonEvent}
    >
      ${CutIcon}
    </button>`;
  }
}

@customElement('affine-note-scissors')
export class NoteScissorsButton extends WithDisposable(LitElement) {
  static override styles = [
    buttonStyle,
    css`
      :host {
        display: none;
        position: absolute;
        left: 0;
        top: 0;
        z-index: 1;
      }
    `,
  ];

  private _rafId = 0;

  show(rect: DOMRect, zoom: number) {
    this.style.display = 'block';
    this.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0) scale(${zoom})`;
    this.style.transformOrigin = `top left`;

    const rafId = requestAnimationFrame(() => {
      this.style.transition = `transform 0.2s 0.2s ease-in-out, transform-origin 0.2s 0.2s ease-in-out`;
      this.style.transform = `translate3d(${rect.x + rect.width * 0.8}px, ${
        rect.y
      }px, 0) scale(${zoom})`;

      if (rafId === this._rafId) this._rafId = 0;
    });
    this._rafId = rafId;
  }

  reset() {
    this._rafId && cancelAnimationFrame(this._rafId);
    this.style.removeProperty('display');
    this.style.removeProperty('transform');
    this.style.removeProperty('transition');
    this.style.removeProperty('transformOrigin');
  }

  override render() {
    return html`<button class="scissors-button">${CutIcon}</button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'note-scissors-button': NoteScissorsVisualButton;
    'affine-note-scissors': NoteScissorsButton;
  }
}
