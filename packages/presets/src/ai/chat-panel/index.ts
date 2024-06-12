import './chat-panel-input.js';
import './chat-panel-messages.js';

import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { debounce } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';
import { css, html, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';

import { AIHelpIcon, SmallHintIcon } from '../_common/icons.js';
import { AIProvider } from '../provider.js';
import {
  getSelectedImagesAsBlobs,
  getSelectedTextContent,
} from '../utils/selection-utils.js';
import type { ChatAction, ChatContextValue, ChatItem } from './chat-context.js';
import type { ChatPanelMessages } from './chat-panel-messages.js';

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
      display: flex;
      justify-content: space-between;
      align-items: center;

      div:first-child {
        font-size: 14px;
        font-weight: 500;
        color: var(--affine-text-secondary-color);
      }

      div:last-child {
        width: 24px;
        height: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
      }
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

  private _chatMessages: Ref<ChatPanelMessages> =
    createRef<ChatPanelMessages>();

  private _chatSessionId = '';

  private _resettingCounter = 0;

  private _resetItems = debounce(() => {
    const counter = ++this._resettingCounter;
    this.isLoading = true;
    (async () => {
      const { doc } = this;

      const [histories, actions] = await Promise.all([
        AIProvider.histories?.chats(doc.collection.id, doc.id),
        AIProvider.histories?.actions(doc.collection.id, doc.id),
      ]);

      if (counter !== this._resettingCounter) return;

      const items: ChatItem[] = actions ? [...actions] : [];

      if (histories?.[0]) {
        this._chatSessionId = histories[0].sessionId;
        items.push(...histories[0].messages);
      }

      this.chatContextValue = {
        ...this.chatContextValue,
        items: items.sort((a, b) => {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }),
      };

      this.isLoading = false;
      this.scrollToDown();
    })().catch(console.error);
  }, 200);

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor doc!: Doc;

  @state()
  accessor isLoading = false;

  @state()
  accessor chatContextValue: ChatContextValue = {
    quote: '',
    images: [],
    abortController: null,
    items: [],
    status: 'idle',
    error: null,
    markdown: '',
  };

  private _cleanupHistories = async () => {
    const notification =
      this.host.std.spec.getService('affine:page').notificationService;
    if (!notification) return;

    if (
      await notification.confirm({
        title: 'Clear History',
        message:
          'Are you sure you want to clear all history? This action will permanently delete all content, including all chat logs and data, and cannot be undone.',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
      })
    ) {
      await AIProvider.histories?.cleanup(this.doc.collection.id, this.doc.id, [
        this._chatSessionId,
        ...(
          this.chatContextValue.items.filter(
            item => 'sessionId' in item
          ) as ChatAction[]
        ).map(item => item.sessionId),
      ]);
      notification.toast('History cleared');
      this._resetItems();
    }
  };

  protected override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('doc')) {
      this._resetItems();
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.doc) throw new Error('doc is required');

    AIProvider.slots.actions.on(({ action, event }) => {
      const { status } = this.chatContextValue;
      if (
        action !== 'chat' &&
        event === 'finished' &&
        (status === 'idle' || status === 'success')
      ) {
        this._resetItems();
      }
    });

    AIProvider.slots.userInfo.on(userInfo => {
      if (userInfo) {
        this._resetItems();
      }
    });

    AIProvider.slots.requestContinueInChat.on(async ({ show }) => {
      if (show) {
        const text = await getSelectedTextContent(this.host, 'plain-text');
        const markdown = await getSelectedTextContent(this.host, 'markdown');
        const images = await getSelectedImagesAsBlobs(this.host);
        this.updateContext({
          quote: text,
          markdown: markdown,
          images: images,
        });
      }
    });
  }

  updateContext = (context: Partial<ChatContextValue>) => {
    this.chatContextValue = { ...this.chatContextValue, ...context };
  };

  continueInChat = async () => {
    const text = await getSelectedTextContent(this.host, 'plain-text');
    const markdown = await getSelectedTextContent(this.host, 'markdown');
    const images = await getSelectedImagesAsBlobs(this.host);
    this.updateContext({
      quote: text,
      markdown,
      images,
    });
  };

  scrollToDown() {
    requestAnimationFrame(() => this._chatMessages.value?.scrollToDown());
  }

  override render() {
    return html` <div class="chat-panel-container">
      <div class="chat-panel-title">
        <div>AFFINE AI</div>
        <div
          @click=${() => {
            AIProvider.toggleGeneralAIOnboarding?.(true);
          }}
        >
          ${AIHelpIcon}
        </div>
      </div>
      <chat-panel-messages
        ${ref(this._chatMessages)}
        .chatContextValue=${this.chatContextValue}
        .updateContext=${this.updateContext}
        .host=${this.host}
        .isLoading=${this.isLoading}
      ></chat-panel-messages>
      <chat-panel-input
        .chatContextValue=${this.chatContextValue}
        .updateContext=${this.updateContext}
        .host=${this.host}
        .cleanupHistories=${this._cleanupHistories}
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
