import type { BlockModel } from '@blocksuite/store';

import { type BlockComponent, ShadowlessElement } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/global/utils';
import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { embedCardModalStyles } from './styles.js';

export class EmbedCardEditCaptionEditModal extends WithDisposable(
  ShadowlessElement
) {
  static override styles = embedCardModalStyles;

  private get _doc() {
    return this.block.doc;
  }

  private get _model() {
    return this.block.model as BlockModel<{ caption: string }>;
  }

  private _onKeydown(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.isComposing) {
      this._onSave();
    }
    if (e.key === 'Escape') {
      this.remove();
    }
  }

  private _onSave() {
    const caption = this.captionInput.value;
    this._doc.updateBlock(this._model, {
      caption,
    });
    this.remove();
  }

  override connectedCallback() {
    super.connectedCallback();

    this.updateComplete
      .then(() => {
        this.captionInput.focus();
      })
      .catch(console.error);

    this.disposables.addFromEvent(this, 'keydown', this._onKeydown);
  }

  override render() {
    return html`
      <div class="embed-card-modal">
        <div class="embed-card-modal-mask" @click=${() => this.remove()}></div>
        <div class="embed-card-modal-wrapper">
          <div class="embed-card-modal-row">
            <label for="card-title">Caption</label>
            <textarea
              class="embed-card-modal-input caption"
              placeholder="Write a caption..."
              .value=${this._model.caption ?? ''}
            ></textarea>
          </div>
          <div class="embed-card-modal-row">
            <button
              class=${classMap({
                'embed-card-modal-button': true,
                save: true,
              })}
              @click=${() => this._onSave()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor block!: BlockComponent;

  @query('.embed-card-modal-input.caption')
  accessor captionInput!: HTMLTextAreaElement;
}

export function toggleEmbedCardCaptionEditModal(block: BlockComponent) {
  const host = block.host;
  host.selection.clear();
  const embedCardEditCaptionEditModal = new EmbedCardEditCaptionEditModal();
  embedCardEditCaptionEditModal.block = block;
  document.body.append(embedCardEditCaptionEditModal);
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-caption-edit-modal': EmbedCardEditCaptionEditModal;
  }
}
