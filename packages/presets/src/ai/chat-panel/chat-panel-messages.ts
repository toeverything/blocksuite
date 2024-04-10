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
  AffineAvatorIcon,
  AffineIcon,
  CreateAsPageIcon,
  DownArrowIcon,
  InsertBelowIcon,
  NewBlockIcon,
  ReplaceIcon,
} from '../_common/icons.js';
import type { CopilotClient } from '../copilot-client.js';
import type { ChatMessage, ChatStatus } from './index.js';

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

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
      color: var(--affine-text-primary-color);
      font-size: 14px;
      font-weight: 500;
    }

    .avator {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: var(--affine-primary-color);
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

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  copilotClient!: CopilotClient;

  @property({ attribute: false })
  messages!: ChatMessage[];

  @property({ attribute: false })
  status!: ChatStatus;

  @query('.chat-panel-messages')
  messagesContainer!: HTMLDivElement;

  private _currentTextSelection: TextSelection | null = null;

  public override connectedCallback() {
    super.connectedCallback();
    this.host.selection.slots.changed.on(() => {
      this._currentTextSelection =
        this.host.selection.find('text') ?? this._currentTextSelection;
    });
  }

  renderItem(message: ChatMessage) {
    return html`<ai-answer-text
      .host=${this.host}
      .answer=${message.content}
    ></ai-answer-text>`;
    // if (message.role === 'user') {
    //   return textRenderer(message.content);
    // } else {
    //   // return iframeRenderer('<html><body><div>123</div></body></html>');
    //   return html`<ai-slides-renderer> </ai-slides-renderer>`;
    // }
  }

  renderAvator(message: ChatMessage) {
    return html`<div class="user-info">
      ${message.role === 'user'
        ? html`<div class="avator"></div>`
        : AffineAvatorIcon}
      ${message.role === 'user' ? 'You' : 'AFFINE AI'}
    </div>`;
  }

  renderLoading() {
    return html` <ai-loading></ai-loading>`;
  }

  scrollToDown() {
    this.messagesContainer.scrollTo(0, this.messagesContainer.scrollHeight);
  }

  renderEditorActions(content: string) {
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
    const { messages } = this;

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
        ${messages.length === 0
          ? html`<div class="chat-panel-messages-placeholder">
              ${AffineIcon}
              <div>What can I help you with?</div>
            </div>`
          : repeat(messages, (message, index) => {
              return html`<div class="message">
                ${this.renderAvator(message)} ${this.renderItem(message)}
                ${this.status === 'loading' && index === messages.length - 1
                  ? this.renderLoading()
                  : nothing}
                ${index === messages.length - 1 &&
                message.role === 'assistant' &&
                this.status === 'success'
                  ? this.renderEditorActions(message.content)
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
  }
}
