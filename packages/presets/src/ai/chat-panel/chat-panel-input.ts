import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { type AIError, openFileOrFiles } from '@blocksuite/blocks';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  ChatAbortIcon,
  ChatSendIcon,
  CloseIcon,
  ImageIcon,
} from '../_common/icons.js';
import { AIProvider } from '../provider.js';
import { reportResponse } from '../utils/action-reporter.js';
import { readBlobAsURL } from '../utils/image.js';
import type { ChatItem, ChatMessage, ChatStatus } from './index.js';

const MaximumImageCount = 8;

@customElement('chat-panel-input')
export class ChatPanelInput extends WithDisposable(LitElement) {
  static override styles = css`
    .chat-panel-input {
      margin-top: 12px;
      position: relative;
      border-radius: 4px;
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
      margin: 8px 12px;
      width: calc(100% - 32px);
      min-height: 100px;
      border: none;
      font-size: 14px;
      font-weight: 400;
      font-family: var(--affine-font-family);
      color: var(--affine-text-primary-color);
    }

    textarea::placeholder {
      font-size: 14px;
      font-weight: 400;
      font-family: var(--affine-font-family);
      color: var(--affine-placeholder-color);
    }

    textarea:focus {
      outline: none;
    }

    .chat-panel-images {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      position: relative;

      .image-container {
        width: 58px;
        height: 58px;
        border-radius: 4px;
        border: 1px solid var(--affine-border-color);
        cursor: pointer;
        overflow: hidden;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;

        img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
        }
      }
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
      cursor: pointer;
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
  updateItems!: (items: ChatItem[]) => void;

  @property({ attribute: false })
  addToItems!: (items: ChatItem[]) => void;

  @property({ attribute: false })
  status!: ChatStatus;

  @property({ attribute: false })
  items!: ChatItem[];

  @property({ attribute: false })
  error!: Error | null;

  @property({ attribute: false })
  updateError!: (error: AIError | null) => void;

  @property({ attribute: false })
  updateStatus!: (status: ChatStatus) => void;

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

  @state()
  focused = false;

  @state()
  abortController?: AbortController;

  send = async () => {
    if (this.status === 'loading' || this.status === 'transmitting') return;

    const text = this.textarea.value;
    const { images } = this;
    if (!text && images.length === 0) {
      return;
    }
    const { doc } = this.host;
    this.textarea.value = '';
    this.isInputEmpty = true;
    this.images = [];
    this.updateStatus('loading');
    this.updateError(null);

    const attachments = await Promise.all(
      images?.map(image => readBlobAsURL(image))
    );
    this.addToItems([
      {
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
        attachments,
      },
      { role: 'assistant', content: '', createdAt: new Date().toISOString() },
    ]);
    try {
      const abortController = new AbortController();
      const stream = AIProvider.actions.chat?.({
        input: text,
        docId: doc.id,
        attachments: images,
        workspaceId: doc.collection.id,
        host: this.host,
        stream: true,
        signal: abortController.signal,
        where: 'chat-panel',
        control: 'chat-send',
      });

      if (stream) {
        this.abortController = abortController;

        for await (const text of stream) {
          this.updateStatus('transmitting');
          const items = [...this.items];
          const last = items[items.length - 1] as ChatMessage;
          last.content += text;
          this.updateItems(items);
        }

        this.updateStatus('success');
      }
    } catch (error) {
      this.updateStatus('error');
      this.updateError(error as AIError);
    } finally {
      this.abortController = undefined;
    }
  };

  protected override render() {
    return html`<style>
        .chat-panel-send svg rect {
          fill: ${this.isInputEmpty && this.images.length === 0
            ? 'var(--affine-text-disable-color)'
            : 'var(--affine-primary-color)'};
        }
        .chat-panel-images {
          margin: ${this.images.length > 0 ? '8px' : '0'};
        }
        .chat-panel-input {
          border: ${this.focused
            ? '1px solid var(--affine-primary-color)'
            : '1px solid var(--affine-border-color)'};
          box-shadow: ${this.focused ? 'var(--affine-active-shadow)' : 'none'};
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
              html`<div
                class="image-container"
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
              >
                <img src="${URL.createObjectURL(image)}" alt="${image.name}" />
              </div>`
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
          @keydown=${async (evt: KeyboardEvent) => {
            if (evt.key === 'Enter' && !evt.shiftKey && !evt.isComposing) {
              evt.preventDefault();
              await this.send();
            }
          }}
          @focus=${() => {
            this.focused = true;
          }}
          @blur=${() => {
            this.focused = false;
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
              this.images = [...this.images, ...images].slice(
                0,
                MaximumImageCount
              );
            }}
          >
            ${ImageIcon}
          </div>
          ${this.status === 'transmitting'
            ? html`<div
                @click=${() => {
                  this.abortController?.abort();
                  this.updateStatus('success');
                  reportResponse('aborted:stop');
                }}
              >
                ${ChatAbortIcon}
              </div>`
            : html`<div @click="${this.send}" class="chat-panel-send">
                ${ChatSendIcon}
              </div>`}
        </div>
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-panel-input': ChatPanelInput;
  }
}
