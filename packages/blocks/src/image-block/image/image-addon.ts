import type { AddonEntry, AddonRegistion } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('blocksuite-addon-portal')
export class AddonPortal extends LitElement {
  static override styles = css`
    :host {
      z-index: calc(var(--affine-z-index-modal) + 3);
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
    }

    .addon-portal {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      align-items: center;
      background-color: var(--affine-background-modal-color);
      justify-content: center;
      display: flex;
    }

    .addon-modal {
      width: 70%;
      min-width: 500px;
      height: 80%;
      overflow-y: scroll;
      background-color: var(--affine-background-overlay-panel-color);
      border-radius: 12px;
      box-shadow: var(--affine-shadow-3);
      position: relative;
    }

    .addon-main {
      height: 100%;
    }

    .addon-footer {
      display: flex;
      justify-content: flex-end;
      gap: 20px;
      padding: 24px;
      position: absolute;
      box-sizing: border-box;
      width: 100%;
      bottom: 0;
      right: 0;
    }

    .addon-footer .button {
      align-items: center;
      background: var(--affine-white);
      border: 1px solid;
      border-color: var(--affine-border-color);
      border-radius: 8px;
      color: var(--affine-text-primary-color);
      cursor: pointer;
      display: inline-flex;
      font-size: var(--affine-font-sm);
      font-weight: 500;
      justify-content: center;
      outline: 0;
      padding: 12px 18px;
      touch-action: manipulation;
      transition: all 0.3s;
      user-select: none;
    }

    .addon-footer .save {
      background: var(--affine-primary-color);
      border-color: var(--affine-black-10);
      box-shadow: var(--affine-button-inner-shadow);
      color: var(--affine-pure-white);
    }
  `;

  imageBlob!: Blob;
  addonLoader: AddonRegistion['load'] | null = null;
  saveCallback: ((image: Blob) => void) | null = null;

  _addonCloseCallback: (() => void) | null = null;
  _addonSaveCallback: ReturnType<AddonEntry>['onSave'] | null = null;

  private async _disconnect() {
    this.addonLoader = null;
    this.saveCallback = null;
    this._addonCloseCallback = null;
    this._addonSaveCallback = null;

    const modal = this.renderRoot.querySelector('.addon-main');
    modal?.children?.[0].remove();
    this.ownerDocument.body.removeChild(this);
  }

  private async _loadAddon(modal: HTMLDivElement) {
    if (!this.addonLoader || !this.imageBlob) {
      this._disconnect();
      return;
    }

    const { main } = await this.addonLoader();
    const { onClose, onSave } = main(modal, this.imageBlob);

    this._addonCloseCallback = onClose;
    this._addonSaveCallback = onSave;
  }

  private _close() {
    try {
      this._addonCloseCallback?.();
    } finally {
      this._disconnect();
    }
  }

  private async _save() {
    if (!this._addonSaveCallback) return;

    try {
      const result = await this._addonSaveCallback();
      const image = this.imageBlob;
      console.log(result, this.saveCallback);
      this.saveCallback?.(result ?? image);
    } finally {
      this._disconnect();
    }
  }

  override firstUpdated(): void {
    const addonModal = this.renderRoot.querySelector(
      '.addon-main'
    ) as HTMLDivElement;
    this._loadAddon(addonModal);
  }

  override render() {
    return html`<div class="addon-portal">
      <div class="addon-modal">
        <div class="addon-main"></div>
        <div class="addon-footer">
          <button class="cancel button" @click=${this._close}>Cancel</button>
          <button class="save button" @click=${this._save}>Save</button>
        </div>
      </div>
    </div>`;
  }
}

export function createAddonPortal(
  addon: AddonRegistion,
  image: Blob,
  saveCallback: (image: Blob) => void
) {
  const addonPortal = new AddonPortal();

  addonPortal.addonLoader = addon.load;
  addonPortal.imageBlob = image;
  addonPortal.saveCallback = saveCallback;

  document.body.appendChild(addonPortal);
}
