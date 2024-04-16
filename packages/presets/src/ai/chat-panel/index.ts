import './chat-panel-input.js';
import './chat-panel-messages.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';

import type { AffineEditorContainer } from '../../editors/index.js';
import { SmallHintIcon } from '../_common/icons.js';
import { AIProvider } from '../provider.js';
import type { ChatPanelMessages } from './chat-panel-messages.js';

export type ChatMessage = {
  content: string;
  role: 'user' | 'assistant';
};

export type ChatAction = {
  action: string;
  messages: ChatMessage[];
  sessionId: string;
};

export type ChatItem = ChatMessage | ChatAction;

export type ChatStatus = 'loading' | 'success' | 'error' | 'idle';

@customElement('chat-panel')
export class ChatPanel extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    chat-panel {
      width: 100%;
    }

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
  items: ChatItem[] = [];

  @state()
  status: ChatStatus = 'idle';

  private _chatMessages: Ref<ChatPanelMessages> =
    createRef<ChatPanelMessages>();

  public override async connectedCallback() {
    super.connectedCallback();

    const { editor } = this;

    const histories =
      (await AIProvider.histories?.chats(
        editor.doc.collection.id,
        editor.doc.id
      )) ?? [];

    const actions =
      (await AIProvider.histories?.actions(
        editor.doc.collection.id,
        editor.doc.id
      )) ?? [];

    this.items = [...actions.reverse()];
    if (histories[0]) {
      this.items = [...this.items, ...histories[0].messages];
    }

    this.scrollToDown();
  }

  get rootService() {
    return this.editor.host.std.spec.getService('affine:page');
  }

  updateStatus = (status: ChatStatus) => {
    this.status = status;
  };

  addToItems = (messages: ChatItem[]) => {
    this.items = [...this.items, ...messages];
    this.scrollToDown();
  };

  updateItems = (messages: ChatItem[]) => {
    this.items = messages;
    this.scrollToDown();
  };

  scrollToDown() {
    requestAnimationFrame(() => this._chatMessages.value?.scrollToDown());
  }

  override render() {
    return html` <div class="chat-panel-container">
      <div class="chat-panel-title">AFFINE AI</div>
      <chat-panel-messages
        ${ref(this._chatMessages)}
        .host=${this.editor.host}
        .items=${this.items}
        .status=${this.status}
      ></chat-panel-messages>
      <chat-panel-input
        .host=${this.editor.host}
        .items=${this.items}
        .updateItems=${this.updateItems}
        .addToItems=${this.addToItems}
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
