import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import type { RootService } from '@blocksuite/blocks';
import { openFileOrFiles } from '@blocksuite/blocks';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { ChatSendIcon, CloseIcon, ImageIcon } from '../_common/icons.js';

const MaximumImageCount = 8;

@customElement('chat-panel-input')
export class ChatPanelInput extends WithDisposable(LitElement) {
  static override styles = css`
    .chat-panel-input {
      margin-top: 12px;
      position: relative;
    }

    .chat-panel-input-actions {
      position: absolute;
      right: 16px;
      bottom: 6px;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .chat-panel-input-actions svg {
      cursor: pointer;
    }

    .chat-panel-input textarea {
      resize: none;
      border-radius: 4px;
      padding: 8px 12px;
      width: calc(100% - 32px);
      min-height: 100px;
      border: 1px solid var(--affine-border-color);
      font-size: 14px;
      font-weight: 400;
      color: var(--affine-text-primary-color);
    }

    textarea::placeholder {
      font-size: 14px;
      font-weight: 400;
      color: var(--affine-placeholder-color);
    }

    textarea:focus {
      border: 1px solid var(--affine-border-color);
      outline: none;
    }

    .chat-panel-images {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      position: relative;
    }
    .chat-panel-images img {
      border-radius: 4px;
      border: 1px solid var(--affine-border-color);
    }

    .close-wrapper {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 1px solid var(--affine-border-color);
      justify-content: center;
      align-items: center;
      display: none;
      position: absolute;
      background-color: var(--affine-white);
      z-index: 1;
    }

    .close-wrapper:hover {
      background-color: var(--affine-background-error-color);
      border: 1px solid var(--affine-error-color);
    }

    .close-wrapper:hover svg path {
      fill: var(--affine-error-color);
    }
  `;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  copilot!: RootService['copilot'];

  @query('textarea')
  textarea!: HTMLTextAreaElement;

  @query('.close-wrapper')
  closeWrapper!: HTMLDivElement;

  @state()
  images: File[] = [];

  @state()
  curIndex = -1;

  @state()
  isInputEmpty = true;

  send = () => {
    const text = this.textarea.value;
    if (!text) {
      return;
    }
    this.textarea.value = '';
    this.isInputEmpty = true;
    this.images = [];
    this.copilot.askAI(
      this.copilot.actions.createCommonTextAction([
        { type: 'text', text },
        ...this.images.map(image => ({
          type: 'image_url' as const,
          image_url: { url: URL.createObjectURL(image) },
        })),
      ]),
      text
    );
  };

  protected override render() {
    return html`<style>
        .chat-panel-send svg rect {
          fill: ${this.isInputEmpty
            ? 'var(--affine-text-disable-color)'
            : 'var(--affine-primary-color)'};
        }
        .chat-panel-images {
          margin: ${this.images.length > 0 ? '8px 0' : '0'};
        }
      </style>
      <div class="chat-panel-input">
        <div
          class="chat-panel-images"
          @mouseleave=${() => {
            this.closeWrapper.style.display = 'none';
            this.curIndex = -1;
          }}
        >
          ${repeat(
            this.images,
            image => image.name,
            (image, index) =>
              html`<img
                @mouseenter=${(evt: MouseEvent) => {
                  const ele = evt.target as HTMLImageElement;
                  const rect = ele.getBoundingClientRect();
                  const parentRect = ele.parentElement!.getBoundingClientRect();
                  const left = rect.right - parentRect.left - 8;
                  const top = parentRect.top - rect.top - 8;
                  this.curIndex = index;
                  this.closeWrapper.style.display = 'flex';
                  this.closeWrapper.style.left = left + 'px';
                  this.closeWrapper.style.top = top + 'px';
                }}
                width="58"
                height="58"
                src="${URL.createObjectURL(image)}"
                alt="${image.name}"
              />`
          )}
          <div
            class="close-wrapper"
            @click=${() => {
              if (this.curIndex >= 0 && this.curIndex < this.images.length) {
                const images = [...this.images];
                images.splice(this.curIndex, 1);
                this.images = images;
                this.curIndex = -1;
                this.closeWrapper.style.display = 'none';
              }
            }}
          >
            ${CloseIcon}
          </div>
        </div>

        <textarea
          placeholder="What are your thoughts?"
          @input=${() => {
            this.isInputEmpty = !this.textarea.value;
          }}
          @keydown=${(evt: KeyboardEvent) => {
            if (evt.key === 'Enter' && !evt.shiftKey) {
              evt.preventDefault();
              this.send();
            }
          }}
        ></textarea>
        <div class="chat-panel-input-actions">
          <div
            class="image-upload"
            @click=${async () => {
              const images = await openFileOrFiles({
                acceptType: 'Images',
                multiple: true,
              });
              if (!images) return;
              this.images = images.slice(0, MaximumImageCount);
            }}
          >
            ${ImageIcon}
          </div>
          <div @click="${this.send}" class="chat-panel-send">
            ${ChatSendIcon}
          </div>
        </div>
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-panel-input': ChatPanelInput;
  }
}
