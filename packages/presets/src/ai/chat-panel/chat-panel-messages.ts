import '../messages/slides-renderer.js';
import './ai-loading.js';
import '../messages/text.js';

import type { TextSelection } from '@blocksuite/block-std';
import { type EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { Text } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  ActionIcon,
  AffineAvatorIcon,
  AffineIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CreateAsPageIcon,
  DownArrowIcon,
  InsertBelowIcon,
  NewBlockIcon,
  ReplaceIcon,
} from '../_common/icons.js';
import type { CopilotClient } from '../copilot-client.js';
import { createTextRenderer } from '../messages/text.js';
import { AIProvider } from '../provider.js';
import type { ChatAction, ChatItem, ChatStatus } from './index.js';

@customElement('action-text')
class ActionText extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .original-text {
      width: 100%;
      padding: 10px 16px;
      border-radius: 4px;
      border: 1px solid var(--affine-border-color);
      margin-bottom: 12px;
    }
    .action {
      display: flex;
      align-items: center;
      gap: 18px;
      height: 22px;
      margin-bottom: 12px;
    }

    .action div:last-child {
      margin-left: auto;
    }

    .answer-prompt {
      padding: 8px;
      background-color: var(--affine-background-secondary-color);
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 14px;
      font-weight: 400;
      color: var(--affine-text-primary-color);
    }

    .answer-prompt .subtitle {
      font-size: 12px;
      font-weight: 500;
      color: var(--affine-text-secondary-color);
    }
  `;

  @state()
  promptShow = false;

  @property({ attribute: false })
  item!: ChatAction;

  @property({ attribute: false })
  host!: EditorHost;

  protected override render() {
    const { item } = this;

    const originalText = item.messages[1].content;
    return html`<style></style>
      <div class="original-text">${originalText}</div>
      <div class="action">
        ${ActionIcon}
        <div>${item.action}</div>
        <div @click=${() => (this.promptShow = !this.promptShow)}>
          ${this.promptShow ? ArrowUpIcon : ArrowDownIcon}
        </div>
      </div>
      ${this.promptShow
        ? html`
            <div class="answer-prompt">
              <div class="subtitle">Answer</div>
              ${createTextRenderer(this.host)(item.messages[2].content)}
              <div class="subtitle">Prompt</div>
              ${createTextRenderer(this.host)(item.messages[0].content)}
            </div>
          `
        : nothing} `;
  }
}

@customElement('chat-panel-messages')
export class ChatPanelMessages extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    chat-panel-messages {
      position: relative;
    }

    .chat-panel-messages {
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
      position: relative;
      overflow-y: auto;
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

    .item-wrapper {
      margin-left: 32px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
      color: var(--affine-text-primary-color);
      font-size: 14px;
      font-weight: 500;
      user-select: none;
    }

    .avator-container {
      width: 24px;
      height: 24px;
    }

    .avator {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: var(--affine-primary-color);
    }

    .avator-container img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .down-indicator {
      position: absolute;
      left: 50%;
      transform: translate(-50%, 0);
      bottom: 50px;
      z-index: 1;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      border: 0.5px solid var(--affine-border-color);
      background-color: var(--affine-background-primary-color);
      box-shadow: var(--affine-shadow-2);
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
    }
  `;

  @state()
  showDownIndicator = false;

  @state()
  avatorUrl = '';

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  copilotClient!: CopilotClient;

  @property({ attribute: false })
  items!: ChatItem[];

  @property({ attribute: false })
  status!: ChatStatus;

  @query('.chat-panel-messages')
  messagesContainer!: HTMLDivElement;

  private _currentTextSelection: TextSelection | null = null;

  public override async connectedCallback() {
    super.connectedCallback();
    this.host.selection.slots.changed.on(() => {
      this._currentTextSelection =
        this.host.selection.find('text') ?? this._currentTextSelection;
    });

    const res = await AIProvider.userInfo;
    this.avatorUrl = res?.avatarUrl ?? '';
  }

  renderItem(item: ChatItem) {
    if ('role' in item) {
      return createTextRenderer(this.host)(item.content);
    } else {
      switch (item.action) {
        case 'Create a presentation':
          return createTextRenderer(this.host)('');
        default:
          return html`<action-text
            .item=${item}
            .host=${this.host}
          ></action-text>`;
      }
    }
    // if (message.role === 'user') {
    //   return textRenderer(message.content);
    // } else {
    //   // return iframeRenderer('<html><body><div>123</div></body></html>');
    //   return html`<ai-slides-renderer> </ai-slides-renderer>`;
    // }
  }

  renderAvator(item: ChatItem) {
    const isUser = 'role' in item && item.role === 'user';

    return html`<div class="user-info">
      ${isUser
        ? html`<div class="avator-container">
            ${this.avatorUrl
              ? html`<img .src=${this.avatorUrl} />`
              : html`<div class="avator"></div>`}
          </div>`
        : AffineAvatorIcon}
      ${isUser ? 'You' : 'AFFINE AI'}
    </div>`;
  }

  renderLoading() {
    return html` <ai-loading></ai-loading>`;
  }

  scrollToDown() {
    this.messagesContainer.scrollTo(0, this.messagesContainer.scrollHeight);
  }

  renderEditorActions(item: ChatItem) {
    if (
      !(
        'role' in item &&
        item.role === 'assistant' &&
        this.status === 'success'
      )
    )
      return nothing;
    const { content } = item;
    return html`
      <style>
        .actions-container {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          margin-top: 8px;
        }

        .actions-container > div {
          display: flex;
          gap: 8px;
        }

        .action {
          width: fit-content;
          padding: 4px 12px;
          border-radius: 8px;
          border: 1px solid var(--affine-border-color);
          background-color: var(--affine-white-10);
          display: flex;
          flex-direction: row;
          gap: 4px;
          font-size: 15px;
          font-weight: 500;
          color: var(--affine-text-primary-color);
          cursor: pointer;
        }
      </style>
      <div class="actions-container">
        <div class="action">
          ${ReplaceIcon}
          <div
            @click=${() => {
              if (!this._currentTextSelection) return;
              this.host.command
                .chain()
                .inline((_, next) => {
                  next({ textSelection: this._currentTextSelection });
                })
                .deleteText()
                .inline((_, next) => {
                  if (!this._currentTextSelection) return;
                  const block = this.host.doc.getBlockById(
                    this._currentTextSelection.blockId
                  );
                  if (block?.text) {
                    block.text.insert(
                      content,
                      this._currentTextSelection.start.index
                    );
                  }
                  next();
                })
                .run();
            }}
          >
            Replace selection
          </div>
        </div>
        <div>
          <div class="action">
            ${InsertBelowIcon}
            <div
              @click=${() => {
                if (this._currentTextSelection) {
                  const { path } = this._currentTextSelection;

                  this.host.command
                    .chain()
                    .getBlockIndex({ path })
                    .inline((ctx, next) => {
                      if (ctx.parentBlock && ctx.blockIndex !== undefined) {
                        this.host.doc.addBlock(
                          'affine:paragraph',
                          { text: new Text(content) },
                          ctx.parentBlock.model,
                          ctx.blockIndex + 1
                        );
                      }
                      next();
                    })
                    .run();
                }
              }}
            >
              Insert below
            </div>
          </div>
          <div class="action">
            ${NewBlockIcon}
            <div
              @click=${() => {
                this.host.spec
                  .getService('affine:page')
                  .appendParagraph(content);
              }}
            >
              New block
            </div>
          </div>
        </div>
        <div class="action">
          ${CreateAsPageIcon}
          <div
            @click=${() => {
              const newDoc = this.host.doc.collection.createDoc();
              newDoc.load();
              const rootId = newDoc.addBlock('affine:page');
              newDoc.addBlock('affine:surface', {}, rootId);
              const noteId = newDoc.addBlock('affine:note', {}, rootId);
              newDoc.addBlock(
                'affine:paragraph',
                { text: new Text(content) },
                noteId
              );
              this.host.spec
                .getService('affine:page')
                .slots.docLinkClicked.emit({
                  docId: newDoc.id,
                });
            }}
          >
            Create as a page
          </div>
        </div>
      </div>
    `;
  }

  protected override render() {
    const { items } = this;

    return html`
      <div
        class="chat-panel-messages"
        @scroll=${(evt: Event) => {
          const element = evt.target as HTMLDivElement;
          this.showDownIndicator =
            element.scrollHeight - element.scrollTop - element.clientHeight >
            200;
        }}
      >
        ${items.length === 0
          ? html`<div class="chat-panel-messages-placeholder">
              ${AffineIcon}
              <div>What can I help you with?</div>
            </div>`
          : repeat(items, (item, index) => {
              return html`<div class="message">
                ${this.renderAvator(item)}
                <div class="item-wrapper">${this.renderItem(item)}</div>

                ${this.status === 'loading' && index === items.length - 1
                  ? this.renderLoading()
                  : nothing}
                ${index === items.length - 1
                  ? this.renderEditorActions(item)
                  : nothing}
              </div>`;
            })}
      </div>
      ${this.showDownIndicator
        ? html`<div class="down-indicator" @click=${() => this.scrollToDown()}>
            ${DownArrowIcon}
          </div>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-panel-messages': ChatPanelMessages;
    'action-text': ActionText;
  }
}
