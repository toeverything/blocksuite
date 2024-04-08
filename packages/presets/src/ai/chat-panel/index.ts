import './chat-panel-messages.js';
import './chat-panel-input.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';

import { CopilotClient } from '../../ai/index.js';
import type { AffineEditorContainer } from '../../editors/index.js';
import { SmallHintIcon } from '../_common/icons.js';
import type { ChatPanelMessages } from './chat-panel-messages.js';

export type ChatMessage = {
  content: string;
  role: 'user' | 'assistant';
};

export type ChatStatus = 'loading' | 'success' | 'error' | 'idle';

@customElement('chat-panel')
export class ChatPanel extends WithDisposable(ShadowlessElement) {
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

    chat-panel-messages {
      flex: 1;
      overflow-y: hidden;
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

  @property({ attribute: false })
  editor!: AffineEditorContainer;

  @state()
  sessionId!: string;

  @state()
  messages: ChatMessage[] = [
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi' },
  ];

  @state()
  status: ChatStatus = 'idle';

  private _copilotClient = new CopilotClient('http://localhost:3010');
  private _chatMessages: Ref<ChatPanelMessages> =
    createRef<ChatPanelMessages>();

  public override async connectedCallback() {
    super.connectedCallback();

    const { editor } = this;
    let sessitonId = localStorage.getItem(
      `blocksuite:chat:${editor.doc.id}:session`
    );
    if (!sessitonId) {
      sessitonId = await this._copilotClient.createSession({
        workspaceId: editor.doc.collection.id,
        docId: editor.doc.id,
        model: 'Gpt35Turbo',
        promptName: '',
      });
    }
    this.sessionId = sessitonId;
    localStorage.setItem(
      `blocksuite:chat:${editor.doc.id}:session`,
      sessitonId
    );
    await this.updateMessages();
  }

  get rootService() {
    return this.editor.host.std.spec.getService('affine:page');
  }

  updateMessages = async () => {
    const histories = await this._copilotClient.getAnonymousHistories(
      this.editor.doc.collection.id,
      this.editor.doc.id
    );
    this.messages =
      histories.find(h => h.sessionId === this.sessionId)?.messages ||
      this.messages;
    this.scrollToDown();
  };

  addToMessages = (messages: ChatMessage[]) => {
    this.messages = [...this.messages, ...messages];
    this.scrollToDown();
  };

  scrollToDown() {
    requestAnimationFrame(() => this._chatMessages.value?.scrollToDown());
  }

  updateStatus = (status: ChatStatus) => {
    this.status = status;
  };

  override render() {
    return html` <div class="chat-panel-container">
      <div class="chat-panel-title">AFFINE AI</div>
      <chat-panel-messages
        ${ref(this._chatMessages)}
        .host=${this.editor.host}
        .copilotClient=${this._copilotClient}
        .messages=${this.messages}
      ></chat-panel-messages>
      <chat-panel-input
        .host=${this.editor.host}
        .copilotClient=${this._copilotClient}
        .sessionId=${this.sessionId}
        .updateMessages=${this.addToMessages}
        .status=${this.status}
        .updateStatus=${this.updateStatus}
      ></chat-panel-input>
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
