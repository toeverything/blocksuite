import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';

import { CloseIcon } from '../../../../_common/icons/import-export.js';

@customElement('ai-panel-discard-modal')
export class AIPanelDiscardModal extends LitElement {
  static override styles = css`
    :host {
      z-index: calc(var(--affine-z-index-modal) + 3);
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      user-select: none;
    }

    .modal-background {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      align-items: center;
      background-color: var(--affine-background-modal-color);
      justify-content: center;
      display: flex;
    }

    .modal-window {
      display: flex;
      flex-direction: column;
      width: 480px;
      height: 194px;
      box-sizing: border-box;
      padding: 20px 24px;
      background-color: var(--affine-background-overlay-panel-color);
      border-radius: 12px;
      box-shadow: var(--affine-shadow-3);
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      color: var(--affine-text-primary-color);
    }

    .modal-header {
      display: flex;
      width: 100%;
      justify-content: space-between;
      padding: 0;
    }

    .modal-header-label {
      line-height: 26px;
      font-weight: 600;
      font-size: var(--affine-font-h-6);
    }

    .modal-header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 24px;
      width: 24px;
      color: var(--affine-icon-color);
      border-radius: 4px;
    }

    .modal-header-icon:hover {
      cursor: pointer;
      background: var(--affine-hover-color);
    }

    .modal-body {
      display: flex;
      width: 100%;
      flex: 1;
      padding-top: 12px;
      padding-bottom: 20px;
      font-size: var(--affine-font-base);
      line-height: 24px;
      font-weight: 400;
    }

    .modal-footer {
      display: flex;
      width: 100%;
      justify-content: flex-end;
      gap: 20px;
      padding-top: 20px;
      box-sizing: border-box;
    }

    .modal-footer .button {
      align-items: center;
      background: var(--affine-white);
      border: 1px solid;
      border-color: var(--affine-border-color);
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      font-size: var(--affine-font-xs);
      line-height: 20px;
      font-weight: 500;
      justify-content: center;
      outline: 0;
      padding: 4px 18px;
      touch-action: manipulation;
      user-select: none;
    }

    .modal-footer .discard:hover {
      color: var(--affine-error-color);
      border-color: var(--affine-error-color);
      background: var(--affine-background-error-color);
    }

    .modal-footer .primary {
      background: var(--affine-primary-color);
      border-color: var(--affine-black-10);
      box-shadow: var(--affine-button-inner-shadow);
      color: var(--affine-pure-white);
    }
  `;

  private _discardCallback: () => void;
  private _cancelCallback: () => void;

  private _close() {
    this._cancelCallback();
    this.remove();
  }

  private _discard() {
    this._discardCallback();
    this.remove();
  }

  constructor(discardCallback: () => void, cancelCallback: () => void) {
    super();
    this._discardCallback = discardCallback;
    this._cancelCallback = cancelCallback;
  }

  override render() {
    return html`<div class="modal-background">
      <div class="modal-window">
        <div class="modal-header">
          <span class="modal-header-label">Discard the AI result</span>
          <span class="modal-header-icon" @click=${this._close}
            >${CloseIcon}</span
          >
        </div>
        <div class="modal-body">
          Do you want to discard the results the AI just generated?
        </div>
        <div class="modal-footer">
          <div class="button discard" @click=${this._discard}>Discard</div>
          <div class="button primary" @click=${this._close}>Cancel</div>
        </div>
      </div>
    </div>`;
  }
}

export function toggleDiscardModal(
  discardCallback: () => void,
  cancelCallback: () => void
) {
  const discardModal = new AIPanelDiscardModal(discardCallback, cancelCallback);
  document.body.append(discardModal);
  return discardModal;
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-panel-discard-modal': AIPanelDiscardModal;
  }
}
