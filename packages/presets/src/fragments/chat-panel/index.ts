import { WithDisposable } from '@blocksuite/block-std';
import { openFileOrFiles } from '@blocksuite/blocks';
import { css, html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { AffineEditorContainer } from '../../editors/index.js';
import {
  AffineIcon,
  ChatSendIcon,
  ImageIcon,
  SmallHintIcon,
} from '../_common/icons.js';

const MaximumImageCount = 8;

export class ChatPanel extends WithDisposable(LitElement) {
  static override styles = css`
    .chat-panel-container {
      display: flex;
      flex-direction: column;
      padding: 0 12px;
      height: 100%;
    }

    .chat-panel-title {
      padding: 8px 0px;
      width: 100%;
      height: 36px;
      font-size: 14px;
      font-weight: 500;
      color: var(--affine-text-secondary-color);
    }

    .chat-panel-messages {
      flex: 1;
      overflow-y: auto;
      position: relative;
    }

    .chat-panel-messages-placeholder {
      width: 100%;
      position: absolute;
      z-index: 1;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .chat-panel-messages-placeholder div {
      color: var(--affine-text-primary-color);
      font-size: 18px;
      font-weight: 600;
    }

    .chat-panel-hints {
      margin: 0 4px;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--affine-border-color);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .chat-panel-hints :first-child {
      color: var(--affine-text-primary-color);
    }

    .chat-panel-hints :nth-child(2) {
      color: var(--affine-text-secondary-color);
    }

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

    .chat-panel-footer {
      margin: 8px 0px;
      height: 20px;
      display: flex;
      gap: 4px;
      align-items: center;
      color: var(--affine-text-secondary-color);
      font-size: 12px;
    }

    .chat-panel-images {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin: 8px 0;
    }
    .chat-panel-images img {
      border-radius: 4px;
      border: 1px solid var(--affine-border-color);
    }
  `;

  @state()
  images: File[] = [];

  @state()
  currentMessage: string = '';

  @property({ attribute: false })
  editor!: AffineEditorContainer;

  public override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.copilot.history.onChange(() => this.requestUpdate())
    );
  }

  get rootService() {
    return this.editor.host.std.spec.getService('affine:page');
  }

  get copilot() {
    return this.rootService.copilot;
  }

  @query('textarea')
  textarea!: HTMLTextAreaElement;

  send = () => {
    const text = this.textarea.value;
    if (!text) {
      return;
    }
    this.textarea.value = '';
    this.currentMessage = '';
    this.copilot.askAI(
      this.copilot.actions.createCommonTextAction([
        { type: 'text', text },
        // {type:'image_url',image_url:{url:'xxx'}}
      ]),
      text
    );
  };

  override render() {
    const messages = this.copilot.history.history;
    return html`<style>
        .chat-panel-send svg rect {
          fill: ${this.currentMessage
            ? 'var(--affine-primary-color)'
            : 'var(--affine-text-disable-color)'};
        }
      </style>
      <div class="chat-panel-container">
        <div class="chat-panel-title">AFFINE AI</div>
        <div class="chat-panel-messages">
          ${messages.length === 0
            ? html`<div class="chat-panel-messages-placeholder">
                ${AffineIcon}
                <div>What can I help you with?</div>
              </div>`
            : repeat(messages, message => message.render(this.editor.host))}
        </div>
        ${messages.length === 0
          ? html`<div class="chat-panel-hints">
              <div>Start with current selection</div>
              <div>you've chosen within the doc</div>
            </div>`
          : nothing}
        <div class="chat-panel-input">
          ${this.images.length > 0
            ? html`<div class="chat-panel-images">
                ${repeat(
                  this.images,
                  image => image.name,
                  image =>
                    html`<img
                      width="58"
                      height="58"
                      src="${URL.createObjectURL(image)}"
                      alt="${image.name}"
                    />`
                )}
              </div>`
            : nothing}
          <textarea
            placeholder="What are your thoughts?"
            @input=${() => {
              this.currentMessage = this.textarea.value;
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
        </div>
        <div class="chat-panel-footer">
          ${SmallHintIcon}
          <div>AI outputs can be misleading or wrong</div>
        </div>
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-panel': ChatPanel;
  }
}

const componentsMap = {
  'chat-panel': ChatPanel,
};

export function registerChatPanelComponents(
  callback: (components: typeof componentsMap) => void
) {
  callback(componentsMap);
}
