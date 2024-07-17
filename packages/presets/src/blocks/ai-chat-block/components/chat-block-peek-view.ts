import type { EditorHost } from '@blocksuite/block-std';

import { baseTheme } from '@toeverything/theme';
import { LitElement, css, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { ChatMessage } from '../types.js';

import './ai-chat-messages.js';
import './date-time.js';

@customElement('ai-chat-block-peek-view')
export class AIChatBlockPeekView extends LitElement {
  static override styles = css`
    :host {
      width: 100%;
      height: 100%;
    }

    .ai-chat-block-peek-view-container {
      gap: 24px;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      justify-content: start;
      flex-direction: column;
      box-sizing: border-box;
      padding: 24px 120px 16px 120px;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }

    .ai-chat-message-container {
      display: flex;
      align-items: center;
      justify-content: start;
      flex-direction: column;
      box-sizing: border-box;
      width: 100%;
      color: var(--affine-text-primary-color);
      line-height: 22px;
      font-size: var(--affine-font-sm);
      overflow-y: auto;
      overflow-x: hidden;
      flex: 1;
      gap: 24px;
      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */
    }

    .ai-chat-message-container::-webkit-scrollbar {
      display: none;
    }

    .ai-chat-input {
      height: 128px;
      width: 100%;
    }
  `;

  override render() {
    const { host, messages } = this;
    const textRendererOptions = {
      customHeading: true,
    };
    const latestMessageCreatedAt = messages[messages.length - 1].createdAt;

    return html`<div class="ai-chat-block-peek-view-container">
      <div class="ai-chat-message-container">
        <ai-chat-messages
          .host=${host}
          .messages=${messages}
          .textRendererOptions=${textRendererOptions}
        ></ai-chat-messages>
        <date-time .date=${latestMessageCreatedAt}></date-time>
      </div>
      <div class="ai-chat-input"></div>
    </div> `;
  }

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor messages: ChatMessage[] = [];
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-chat-block-peek-view': AIChatBlockPeekView;
  }
}
