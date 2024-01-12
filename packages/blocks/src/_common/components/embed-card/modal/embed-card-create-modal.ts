import type { EditorHost } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { isValidUrl } from '../../../utils/url.js';
import { toast } from '../../toast.js';
import { embedCardModalStyles } from './styles.js';

@customElement('embed-card-create-modal')
export class EmbedCardCreateModal extends WithDisposable(ShadowlessElement) {
  static override styles = embedCardModalStyles;

  @property({ attribute: false })
  titleText!: string;

  @property({ attribute: false })
  descriptionText!: string;

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
    return html`<div class="embed-card-modal blocksuite-overlay">
      <div class="embed-card-modal-mask" @click=${this._onCancel}></div>
      <div class="embed-card-modal-wrapper">
        <div class="embed-card-modal-title">${this.titleText}</div>

        <div class="embed-card-modal-content">
          <div class="embed-card-modal-content-text">
            ${this.descriptionText}
          </div>

          <input
            class="embed-card-modal-input link"
            tabindex="0"
            type="text"
            placeholder="Input in https://..."
            value=${this._linkInputValue}
            @input=${this._handleInput}
          />
        </div>

        <div class="embed-card-modal-action">
          <div
            class="embed-card-modal-button cancel"
            tabindex="0"
            @click=${() => this.remove()}
          >
            Cancel
          </div>

          <div
            class=${classMap({
              'embed-card-modal-button': true,
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

export async function toggleEmbedCardCreateModal(
  host: EditorHost,
  titleText: string,
  descriptionText: string,
  urlRegex?: RegExp
): Promise<null | string> {
  host.selection.clear();
  const embedCardCreateModal = new EmbedCardCreateModal();
  return new Promise(resolve => {
    embedCardCreateModal.titleText = titleText;
    embedCardCreateModal.descriptionText = descriptionText;
    embedCardCreateModal.checkUrl = url => {
      if (urlRegex) return urlRegex.test(url);
      return isValidUrl(url);
    };
    embedCardCreateModal.onConfirm = url => {
      resolve(url);
    };
    embedCardCreateModal.onCancel = () => {
      resolve(null);
    };
    document.body.appendChild(embedCardCreateModal);
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-create-modal': EmbedCardCreateModal;
  }
}
