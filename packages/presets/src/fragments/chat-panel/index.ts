import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

import type { AffineEditorContainer } from '../../editors/index.js';
import {
  AffineIcon,
  ChatSendIcon,
  ImageIcon,
  SmallHintIcon,
} from '../_common/icons.js';

type ChatMessage =
  | {
      type: 'user';
      content: string;
    }
  | {
      type: 'ai';
      content: string;
    };

type ChatStatus = 'idle' | 'loading' | 'error' | 'success';

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
      height: 100px;
      position: relative;
    }

    .chat-panel-input-actions {
      position: absolute;
      right: 16px;
      bottom: -6px;
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
      height: calc(100% - 12px);
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
  `;
  @state()
  messages: ChatMessage[] = [];

  @state()
  status: ChatStatus = 'idle';

  @property({ attribute: false })
  editor!: AffineEditorContainer;

  override render() {
    const { messages } = this;

    return html`<div class="chat-panel-container">
      <div class="chat-panel-title">AFFINE AI</div>
      <div class="chat-panel-messages">
        ${messages.length === 0
          ? html`<div class="chat-panel-messages-placeholder">
              ${AffineIcon}
              <div>What can I help you with?</div>
            </div>`
          : nothing}
      </div>
      ${messages.length === 0 &&
      html`<div class="chat-panel-hints">
        <div>Start with current selection</div>
        <div>you've chosen within the doc</div>
      </div>`}
      <div class="chat-panel-input">
        <textarea placeholder="What are your thoughts? "> </textarea>
        <div class="chat-panel-input-actions">
          <div class="image-upload">${ImageIcon}</div>
          <div class="chat-panel-send">${ChatSendIcon}</div>
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
