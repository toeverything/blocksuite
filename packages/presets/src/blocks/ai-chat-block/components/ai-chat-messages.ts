import type { EditorHost } from '@blocksuite/block-std';
import type { AffineAIPanelState } from '@blocksuite/blocks';

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import type { ChatMessage } from '../types.js';
import type { TextRendererOptions } from './text-renderer.js';

import './chat-images.js';
import './text-renderer.js';
import { UserInfoTemplate } from './user-info.js';

@customElement('ai-chat-message')
export class AIChatMessage extends LitElement {
  static override styles = css`
    .ai-chat-message {
      display: flex;
      width: 100%;
      flex-direction: column;
      gap: 4px;
      box-sizing: border-box;
    }

    .ai-chat-content {
      display: block;
      width: calc(100% - 34px);
      padding-left: 34px;
      font-weight: 400;
    }

    .ai-chat-user-message.with-attachments {
      margin-top: 8px;
    }
  `;

  override render() {
    const { host, message, textRendererOptions, state } = this;
    const isUserMessage = 'role' in message && message.role === 'user';
    const withAttachments =
      !!message.attachments && message.attachments.length > 0;

    const userMessageClasses = classMap({
      'ai-chat-user-message': true,
      'with-attachments': withAttachments,
    });

    return html`
      <div class="ai-chat-message">
        ${UserInfoTemplate(message)}
        <div class="ai-chat-content">
          <chat-images .attachments=${message.attachments}></chat-images>
          ${isUserMessage
            ? html`<div class=${userMessageClasses}>${message.content}</div>`
            : html`<text-renderer
                .host=${host}
                .answer=${message.content}
                .options=${textRendererOptions}
                .state=${state}
              ></text-renderer>`}
        </div>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor message!: ChatMessage;

  @property({ attribute: false })
  accessor state: AffineAIPanelState = 'finished';

  @property({ attribute: false })
  accessor textRendererOptions: TextRendererOptions = {};
}

@customElement('ai-chat-messages')
export class AIChatMessages extends LitElement {
  static override styles = css`
    :host {
      width: 100%;
      box-sizing: border-box;
    }

    .ai-chat-messages {
      display: flex;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      flex-direction: column;
      gap: 24px;
    }
  `;

  override render() {
    return html`<div class="ai-chat-messages">
      ${repeat(
        this.messages,
        message => message.id,
        message => html`
          <ai-chat-message
            .host=${this.host}
            .message=${message}
            .textRendererOptions=${this.textRendererOptions}
          ></ai-chat-message>
        `
      )}
    </div>`;
  }

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor messages: ChatMessage[] = [];

  @property({ attribute: false })
  accessor textRendererOptions: TextRendererOptions = {};
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-chat-message': AIChatMessage;
    'ai-chat-messages': AIChatMessages;
  }
}
