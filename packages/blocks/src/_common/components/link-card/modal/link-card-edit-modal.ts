import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { BookmarkBlockComponent } from '../../../../bookmark-block/bookmark-block.js';
import type { BookmarkBlockModel } from '../../../../bookmark-block/bookmark-model.js';
import type { EmbedGithubBlockComponent } from '../../../../embed-github-block/embed-github-block.js';
import type { EmbedGithubModel } from '../../../../embed-github-block/embed-github-model.js';
import { toast } from '../../toast.js';
import { linkCardModalStyles } from './styles.js';

@customElement('link-card-edit-modal')
export class LinkCardEditModal extends WithDisposable(ShadowlessElement) {
  static override styles = linkCardModalStyles;

  @property({ attribute: false })
  linkCardElement!: BookmarkBlockComponent | EmbedGithubBlockComponent;

  @query('.title')
  titleInput!: HTMLInputElement;

  @query('.description')
  descInput!: HTMLInputElement;

  @state()
  private _titleInputValue = '';

  get model(): BookmarkBlockModel | EmbedGithubModel {
    return this.linkCardElement.model;
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
      toast('Link title can not be empty');
      return;
    }

    this.linkCardElement.page.updateBlock(this.model, {
      title,
      description: this.descInput.value,
    });
    this.remove();
  }

  override render() {
    return html`
      <div class="link-card-modal blocksuite-overlay">
        <div class="link-card-modal-mask" @click=${() => this.remove()}></div>
        <div class="link-card-modal-wrapper">
          <div class="link-card-modal-title">Edit Link</div>

          <div class="link-card-modal-content">
            <input
              class="link-card-modal-input title"
              type="text"
              placeholder="Title"
              value=${this._titleInputValue}
              @input=${this._handleInput}
              tabindex="0"
            />

            <textarea
              class="link-card-modal-input description"
              placeholder="Description"
              .value=${this.model.description ?? ''}
              tabindex="0"
            ></textarea>
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

export function toggleLinkCardEditModal(
  linkCardElement: BookmarkBlockComponent | EmbedGithubBlockComponent
) {
  linkCardElement.host.selection.clear();
  const linkCardEditModal = new LinkCardEditModal();
  linkCardEditModal.linkCardElement = linkCardElement;
  document.body.appendChild(linkCardEditModal);
}

declare global {
  interface HTMLElementTagNameMap {
    'link-card-edit-modal': LinkCardEditModal;
  }
}
