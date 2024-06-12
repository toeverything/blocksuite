import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { BookmarkBlockModel } from '../../../../bookmark-block/bookmark-model.js';
import type { EmbedFigmaModel } from '../../../../embed-figma-block/embed-figma-model.js';
import type { EmbedGithubModel } from '../../../../embed-github-block/embed-github-model.js';
import type { EmbedLoomModel } from '../../../../embed-loom-block/embed-loom-model.js';
import type { EmbedYoutubeModel } from '../../../../embed-youtube-block/embed-youtube-model.js';
import { toast } from '../../toast.js';
import { embedCardModalStyles } from './styles.js';

type EmbedCardModel =
  | BookmarkBlockModel
  | EmbedGithubModel
  | EmbedYoutubeModel
  | EmbedFigmaModel
  | EmbedLoomModel;

@customElement('embed-card-edit-modal')
export class EmbedCardEditModal extends WithDisposable(ShadowlessElement) {
  static override styles = embedCardModalStyles;

  @state()
  private accessor _titleInputValue = '';

  @property({ attribute: false })
  accessor model!: EmbedCardModel;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @query('.embed-card-modal-input.title')
  accessor titleInput!: HTMLInputElement;

  @query('.embed-card-modal-input.description')
  accessor descInput!: HTMLTextAreaElement;

  private _handleInput(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this._titleInputValue = target.value;
  }

  private _onDocumentKeydown(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.isComposing) {
      this._onSave();
    }
    if (e.key === 'Escape') {
      this.remove();
    }
  }

  private _onSave() {
    const title = this.titleInput.value;
    if (title.length === 0) {
      toast(this.host, 'Link title can not be empty');
      return;
    }

    this.model.doc.updateBlock(this.model, {
      title,
      description: this.descInput.value,
    });
    this.remove();
  }

  override connectedCallback() {
    super.connectedCallback();

    this.updateComplete
      .then(() => {
        this.titleInput.focus();
        this.titleInput.setSelectionRange(0, this.titleInput.value.length);
      })
      .catch(console.error);

    this.disposables.addFromEvent(this, 'keydown', this._onDocumentKeydown);

    this._titleInputValue = this.model.title ?? '';
  }

  override render() {
    return html`
      <div class="embed-card-modal">
        <div class="embed-card-modal-mask" @click=${() => this.remove()}></div>
        <div class="embed-card-modal-wrapper">
          <div class="embed-card-modal-title">Edit Link</div>

          <div class="embed-card-modal-content">
            <input
              class="embed-card-modal-input title"
              type="text"
              placeholder="Title"
              value=${this._titleInputValue}
              @input=${this._handleInput}
              tabindex="0"
            />

            <textarea
              class="embed-card-modal-input description"
              placeholder="Description"
              .value=${this.model.description ?? ''}
              tabindex="0"
            ></textarea>
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
                save: true,
                disabled: this._titleInputValue.length === 0,
              })}
              tabindex="0"
              @click=${() => this._onSave()}
            >
              Save
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

export function toggleEmbedCardEditModal(
  host: EditorHost,
  embedCardModel: EmbedCardModel
) {
  host.selection.clear();
  const embedCardEditModal = new EmbedCardEditModal();
  embedCardEditModal.model = embedCardModel;
  embedCardEditModal.host = host;
  document.body.append(embedCardEditModal);
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-edit-modal': EmbedCardEditModal;
  }
}
