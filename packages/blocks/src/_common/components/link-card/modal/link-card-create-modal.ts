import type { EditorHost } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { isValidUrl } from '../../../utils/url.js';
import { toast } from '../../toast.js';
import { linkCardModalStyles } from './styles.js';

@customElement('link-card-create-modal')
export class LinkCardCreateModal extends WithDisposable(ShadowlessElement) {
  static override styles = linkCardModalStyles;

  @property({ attribute: false })
  labelText: string = 'Create a Bookmark that previews a link in card view.';

  @property({ attribute: false })
  checkUrl?: (url: string) => boolean;

  @property({ attribute: false })
  onCancel?: () => void;

  @property({ attribute: false })
  onConfirm?: (url: string) => void;

  @query('input')
  input!: HTMLInputElement;

  @state()
  private _linkInputValue = '';

  override connectedCallback() {
    super.connectedCallback();

    this.updateComplete
      .then(() => {
        requestAnimationFrame(() => {
          this.input.focus();
        });
      })
      .catch(console.error);
    this.disposables.addFromEvent(this, 'keydown', this._onDocumentKeydown);
  }

  private _handleInput(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this._linkInputValue = target.value;
  }

  private _onDocumentKeydown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.isComposing) {
      this._onConfirm();
    }
    if (e.key === 'Escape') {
      this.remove();
    }
  };

  private _onConfirm = () => {
    const url = this.input.value;

    if (!this.checkUrl?.(url)) {
      toast('Invalid link');
      return;
    }

    this.onConfirm?.(url);
    this.remove();
  };

  private _onCancel = () => {
    this.onCancel?.();
    this.remove();
  };

  override render() {
    return html`<div class="link-card-modal blocksuite-overlay">
      <div class="link-card-modal-mask" @click=${this._onCancel}></div>
      <div class="link-card-modal-wrapper">
        <div class="link-card-modal-title">Create Link</div>

        <div class="link-card-modal-content">
          <div class="link-card-modal-content-text">${this.labelText}</div>

          <input
            class="link-card-modal-input link"
            tabindex="0"
            type="text"
            placeholder="Input in https://..."
            value=${this._linkInputValue}
            @input=${this._handleInput}
          />
        </div>

        <div class="link-card-modal-action">
          <div
            class="link-card-modal-button cancel"
            tabindex="0"
            @click=${() => this.remove()}
          >
            Cancel
          </div>

          <div
            class=${classMap({
              'link-card-modal-button': true,
              confirm: true,
              disabled: !this.checkUrl?.(this._linkInputValue),
            })}
            tabindex="0"
            @click=${this._onConfirm}
          >
            Confirm
          </div>
        </div>
      </div>
    </div>`;
  }
}

export async function toggleLinkCardCreateModal(
  host: EditorHost,
  urlRegex?: RegExp,
  labelText?: string
): Promise<null | string> {
  host.selection.clear();
  const linkCardCreateModal = new LinkCardCreateModal();
  return new Promise(resolve => {
    if (labelText) linkCardCreateModal.labelText = labelText;
    linkCardCreateModal.checkUrl = url => {
      if (urlRegex) return urlRegex.test(url);
      return isValidUrl(url);
    };
    linkCardCreateModal.onConfirm = url => {
      resolve(url);
    };
    linkCardCreateModal.onCancel = () => {
      resolve(null);
    };
    document.body.appendChild(linkCardCreateModal);
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'link-card-create-modal': LinkCardCreateModal;
  }
}
