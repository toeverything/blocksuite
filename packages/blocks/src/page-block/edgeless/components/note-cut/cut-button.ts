import { CutIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

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
    background-color: var(--affine-background-primary-color);
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
        background-color: var(--affine-hover-color);
      }
    `,
  ];

  @property({ attribute: false })
  edgelessPage!: EdgelessPageBlockComponent;

  @query('.scissors-button')
  private _button!: HTMLButtonElement;

  private _externalButton: null | NoteScissorsButton = null;

  private _reseted = false;

  private _createExternalButton() {
    const externalButton = document.createElement(
      'affine-note-scissors'
    ) as NoteScissorsButton;

    document.body.appendChild(externalButton);
    this._externalButton = externalButton;
    this._disposables.add(() => {
      document.body.removeChild(externalButton);
      this._externalButton = null;
    });
  }

  private _slideout() {
    this._reseted = false;

    this._button.addEventListener('transitionend', this._popupButton, {
      once: true,
    });
    this._button.classList.add('slideout');
  }

  private _popupButton = () => {
    if (!this._externalButton || this._reseted) return;

    const button = this._externalButton;

    requestAnimationFrame(() => {
      const rect = this._button.getBoundingClientRect();

      this._button.style.visibility = 'hidden';
      button.show(rect, this.edgelessPage.surface.viewport.zoom);
      button.addEventListener(
        'transitionend',
        () => {
          this._dispatchIndicatorEvent();
        },
        { once: true }
      );
    });
  };

  private _dispatchIndicatorEvent() {
    const e = new CustomEvent('showindicator');

    this.dispatchEvent(e);
  }

  protected override firstUpdated(): void {
    if (!this._externalButton) {
      this._createExternalButton();
    }
  }

  reset() {
    this._reseted = true;
    this._button.removeEventListener('transitionend', this._popupButton);
    this._button.classList.remove('slideout');
    this._button.style.removeProperty('visibility');
    this._externalButton?.reset();
  }

  override render() {
    return html`<button class="scissors-button" @mouseenter=${this._slideout}>
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
        visibility: none;
        position: absolute;
        left: 0;
        top: 0;
        z-index: 1;
      }

      .scissors-button {
        background-color: var(--affine-tag-white);
      }
    `,
  ];

  private _rafId = 0;

  show(rect: DOMRect, zoom: number) {
    this.style.visibility = 'visible';
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
    this.style.removeProperty('visibility');
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
