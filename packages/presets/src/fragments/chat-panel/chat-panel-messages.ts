import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import type { RootService } from '@blocksuite/blocks';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { AffineIcon, DownArrowIcon } from '../_common/icons.js';

@customElement('chat-panel-messages')
export class ChatPanelMessages extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: relative;
    }

    .chat-panel-messages {
      display: flex;
      flex-direction: column;
      gap: 24px;
      height: 100%;
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
  showDownIndicator = true;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  copilot!: RootService['copilot'];

  @query('.chat-panel-messages')
  messagesContainer!: HTMLDivElement;

  public override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.copilot.history.onChange(() => this.requestUpdate())
    );
  }

  protected override render() {
    const messages = this.copilot.history.history;

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
          : repeat(messages, message => {
              return html`<div class="message">
                <div class="user-info">
                  <div class="avator"></div>
                  ${message.isUser ? 'You' : 'AFFINE AI'}
                </div>
                ${message.render(this.host)}
              </div>`;
            })}
      </div>
      ${this.showDownIndicator
        ? html`<div
            class="down-indicator"
            @click=${() =>
              this.messagesContainer.scrollTo(
                0,
                this.messagesContainer.scrollHeight
              )}
          >
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
