import '../messages/slides-renderer.js';
import './ai-loading.js';
import '../messages/text.js';
import './actions/text.js';
import './actions/action-wrapper.js';
import './actions/make-real.js';
import './actions/slides.js';
import './actions/mindmap.js';
import './actions/chat-text.js';

import type { BlockSelection, TextSelection } from '@blocksuite/block-std';
import { type EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { type AIError, PaymentRequiredError } from '@blocksuite/blocks';
import { Text } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  AffineAvatarIcon,
  AffineIcon,
  CreateAsPageIcon,
  DownArrowIcon,
  InsertBelowIcon,
  NewBlockIcon,
  ReplaceIcon,
} from '../_common/icons.js';
import {
  GeneralErrorRenderer,
  PaymentRequiredErrorRenderer,
} from '../messages/error.js';
import { AIProvider } from '../provider.js';
import { insertBelow, replace } from '../utils/editor-actions.js';
import type { ChatItem, ChatStatus } from './index.js';

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

    .avatar-container {
      width: 24px;
      height: 24px;
    }

    .avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: var(--affine-primary-color);
    }

    .avatar-container img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .down-indicator {
      position: absolute;
      left: 50%;
      transform: translate(-50%, 0);
      bottom: 24px;
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
  avatarUrl = '';

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  items!: ChatItem[];

  @property({ attribute: false })
  status!: ChatStatus;

  @property({ attribute: false })
  error?: AIError;

  @query('.chat-panel-messages')
  messagesContainer!: HTMLDivElement;

  private _currentTextSelection: TextSelection | null = null;
  private _currentBlockSelections: BlockSelection[] | null = null;

  public override async connectedCallback() {
    super.connectedCallback();
    this.host.selection.slots.changed.on(() => {
      this._currentTextSelection =
        this.host.selection.find('text') ?? this._currentTextSelection;
      this._currentBlockSelections = this.host.selection.filter('block');
    });

    const res = await AIProvider.userInfo;
    this.avatarUrl = res?.avatarUrl ?? '';
  }

  renderItem(item: ChatItem, isLast: boolean) {
    if (isLast && this.status === 'error') {
      if (this.error instanceof PaymentRequiredError) {
        return PaymentRequiredErrorRenderer(this.host);
      } else {
        return GeneralErrorRenderer(this.error?.message);
      }
    }

    if ('role' in item) {
      return html`<chat-text
        .host=${this.host}
        .blobs=${item.blobs}
        .text=${item.content}
      ></chat-text>`;
    } else {
      switch (item.action) {
        case 'Create a presentation':
          return html`<action-slides
            .host=${this.host}
            .item=${item}
          ></action-slides>`;
        case 'Make it real':
          return html`<action-make-real
            .host=${this.host}
            .item=${item}
          ></action-make-real>`;
        case 'Brainstorm mindmap':
          return html`<action-mindmap
            .host=${this.host}
            .item=${item}
          ></action-mindmap>`;
        default:
          return html`<action-text
            .item=${item}
            .host=${this.host}
          ></action-text>`;
      }
    }
  }

  renderAvatar(item: ChatItem) {
    const isUser = 'role' in item && item.role === 'user';

    return html`<div class="user-info">
      ${isUser
        ? html`<div class="avatar-container">
            ${this.avatarUrl
              ? html`<img .src=${this.avatarUrl} />`
              : html`<div class="avatar"></div>`}
          </div>`
        : AffineAvatarIcon}
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
          height: 32px;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--affine-border-color);
          background-color: var(--affine-white-10);
          display: flex;
          flex-direction: row;
          align-items: center;
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
            @click=${async () => {
              if (!this._currentTextSelection) return;
              const [_, data] = this.host.command
                .chain()
                .getSelectedBlocks({
                  currentTextSelection: this._currentTextSelection,
                  currentBlockSelections:
                    this._currentBlockSelections ?? undefined,
                })
                .run();
              if (!data.selectedBlocks) return;

              await replace(
                this.host,
                content,
                data.selectedBlocks[0],
                data.selectedBlocks.map(block => block.model),
                this._currentTextSelection
              );
            }}
          >
            Replace selection
          </div>
        </div>
        <div>
          <div class="action">
            ${InsertBelowIcon}
            <div
              @click=${async () => {
                if (!this._currentTextSelection) return;
                const [_, data] = this.host.command
                  .chain()
                  .getSelectedBlocks({
                    currentTextSelection: this._currentTextSelection,
                    currentBlockSelections:
                      this._currentBlockSelections ?? undefined,
                  })
                  .run();
                if (!data.selectedBlocks) return;

                await insertBelow(
                  this.host,
                  content,
                  data.selectedBlocks[data.selectedBlocks?.length - 1]
                );
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
          : repeat(
              items.filter(item => {
                return 'role' in item || item.messages?.length === 3;
              }),
              (item, index) => {
                return html`<div class="message">
                  ${this.renderAvatar(item)}
                  <div class="item-wrapper">
                    ${this.renderItem(item, index === items.length - 1)}
                  </div>
                  <div class="item-wrapper">
                    ${this.status === 'loading' && index === items.length - 1
                      ? this.renderLoading()
                      : nothing}
                  </div>
                  ${index === items.length - 1
                    ? this.renderEditorActions(item)
                    : nothing}
                </div>`;
              }
            )}
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
