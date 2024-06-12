import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ChatServiceKind,
  EmbeddingServiceKind,
} from '../copilot-service/service-base.js';
import { ChatFeatureKey } from '../doc/api.js';
import type { AILogic } from '../logic.js';
import type { ChatMessage, ChatReactiveData, EmbeddedDoc } from './logic.js';

@customElement('copilot-chat-panel')
export class CopilotChatPanel
  extends WithDisposable(ShadowlessElement)
  implements ChatReactiveData
{
  get chat() {
    return this.logic.chat;
  }

  get host() {
    return this.logic.getHost();
  }

  get loading(): boolean {
    return this.currentRequest != null;
  }

  static override styles = css`
    copilot-chat-panel {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      width: 100%;
      font-family: var(--affine-font-family);
      height: 100%;
      gap: 4px;
      overflow: auto;
    }

    .copilot-chat-prompt-container {
      border-top: 0.5px solid var(--affine-border-color);
      height: 189px;
      padding: 8px;
      display: flex;
      gap: 10px;
    }

    .copilot-chat-prompt {
      flex: 1;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      outline: none;
      background-color: transparent;
    }

    .send-button {
      height: 32px;
      border-radius: 50%;
      width: 32px;
      background-color: var(--affine-primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .sync-workspace-button {
      border: 1px solid var(--affine-border-color);
      height: 32px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .synced-doc-list {
      margin-bottom: 14px;
      color: var(--affine-text-secondary-color);
      font-size: 12px;
    }

    .history-item {
      position: relative;
      max-width: calc(100% - 78px);
      display: flex;
      flex-direction: column;
      padding: 10px;
      border-radius: 8px;
      font-size: 14px;
      border: 0.5px solid var(--affine-border-color);
      background-color: var(--affine-background-primary-color);
      white-space: pre-wrap;
      line-height: 22px;
      color: var(--affine-text-primary-color);
    }

    .history-refs {
      font-size: 12px;
      color: var(--affine-text-secondary-color);
    }
  `;

  @property({ attribute: false })
  accessor logic!: AILogic;

  @query('.chat-messages-container')
  accessor chatMessagesContainer!: HTMLDivElement;

  @state()
  accessor tempMessage: string | undefined = undefined;

  @state()
  accessor history: ChatMessage[] = [];

  @state()
  accessor currentRequest: number | undefined = undefined;

  @state()
  accessor value = '';

  @state()
  accessor syncedDocs: EmbeddedDoc[] = [];

  @state()
  accessor surfaceSelection = false;

  @state()
  accessor docSelection = false;

  @query('.copilot-chat-panel-chat-input')
  accessor input!: HTMLInputElement;

  protected override updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    if (
      _changedProperties.has('history') ||
      _changedProperties.has('tempMessage')
    ) {
      this.chatMessagesContainer.scrollTop =
        this.chatMessagesContainer.scrollHeight;
    }
  }

  protected override render(): unknown {
    const getAnswer = async () => {
      this.input.focus();
      const text = this.input.value;
      this.input.value = '';
      await this.chat.genAnswer(text);
    };
    const keydown = async (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.isComposing) {
        e.preventDefault();
        await getAnswer();
      }
    };
    const sendButtonStyle = styleMap({
      opacity: !this.loading ? '1' : '0.5',
    });

    return html`
      <div style="display:flex;flex-direction: column;height: 100%">
        <div
          style="display:flex;flex-direction: column;gap: 12px;margin-bottom: 12px;padding: 0 17px"
        >
          <div class="service-provider-container">
            <div class="service-type">Embedding Service</div>
            <vendor-service-select
              .featureKey="${ChatFeatureKey}"
              .service="${EmbeddingServiceKind}"
            ></vendor-service-select>
          </div>
          <div class="service-provider-container">
            <div class="service-type">Chat Service</div>
            <vendor-service-select
              .featureKey="${ChatFeatureKey}"
              .service="${ChatServiceKind}"
            ></vendor-service-select>
          </div>
        </div>
        <div
          class="chat-messages-container"
          style="display:flex;flex-direction: column;flex: 1;overflow: auto"
        >
          <div
            style="flex:1;gap:42px;flex-direction: column;display:flex;padding: 0 7px 42px"
          >
            ${repeat(this.history, this.renderMessage)}
            ${this.tempMessage
              ? this.renderMessage({
                  role: 'assistant',
                  content: this.tempMessage,
                  sources: [],
                })
              : nothing}
          </div>
        </div>
        <div>
          ${this.toolbar()}
          <div class="copilot-chat-prompt-container">
            <textarea
              @keydown="${keydown}"
              autocomplete="off"
              data-1p-ignore
              placeholder="Type here ask Copilot some thing..."
              class="copilot-chat-panel-chat-input copilot-chat-prompt"
              style="resize: none;"
            ></textarea>
            <div>
              <div
                @click="${getAnswer}"
                style="${sendButtonStyle}"
                class="send-button"
              >
                <sl-icon name="stars"></sl-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.logic.chat.reactiveData = this;
    this.disposables.add(
      this.host.doc.collection.slots.docUpdated.on(() => {
        this.requestUpdate();
      })
    );
    this.checkSelection();
    this.disposables.add(
      this.host.selection.slots.changed.on(() => {
        this.checkSelection();
      })
    );
  }

  checkSelection() {
    this.surfaceSelection = this.host.selection.value.some(
      v => v.type === 'surface'
    );
    this.docSelection = this.host.selection.value.some(v => v.type === 'block');
  }

  addSelectionBackground = async () => {
    if (this.surfaceSelection) {
      await this.chat.selectShapesForBackground();
    }
    if (this.docSelection) {
      await this.chat.selectTextForBackground();
    }
    this.requestUpdate();
  };

  renderMessage = (message: ChatMessage) => {
    if (message.role === 'system') {
      return null;
    }
    if (message.role === 'user') {
      const style = styleMap({
        alignSelf: 'flex-end',
      });
      return html` <div class="history-item" style="${style}">
        ${repeat(message.content, item => {
          if (item.type === 'text') {
            return html`<div style="width: fit-content">${item.text}</div>`;
          }
          if (item.type === 'image_url') {
            return html`<div style="width: fit-content">
              <img .src="${item.image_url.url}" style="max-width: 100px" />
            </div>`;
          }
          return null;
        })}
      </div>`;
    }
    if (message.role === 'assistant') {
      const style = styleMap({
        alignItems: 'flex-start',
        backgroundColor: 'var(--affine-blue-100)',
      });
      return html`
        <div class="history-item" style="${style}">
          <div style="width: fit-content">${message.content}</div>
          ${message.sources?.length
            ? html` <div class="history-refs">
                <div style="margin-top: 8px;">sources:</div>
                <div
                  style="display: flex;flex-direction: column;gap: 4px;padding: 4px;"
                >
                  ${repeat(message.sources, ref => {
                    const doc = this.host.doc.collection.getDoc(ref.id);
                    if (!doc) {
                      return;
                    }
                    const title = doc.meta?.title || 'Untitled';
                    const jumpTo = () => {
                      this.host.doc = doc;
                    };
                    return html` <a @click="${jumpTo}" style="cursor: pointer"
                      >${title}</a
                    >`;
                  })}
                </div>
              </div>`
            : null}

          <div
            style="
                  position:absolute;
                  bottom:-35px;
                  left: 0;
                  display:flex;
                  align-items:center;
                  gap: 8px;
                  user-select: none;
                  height: 28px;
                  white-space: nowrap;
                  width: 100%;
                  justify-content: flex-end;
"
          >
            <div
              @click="${() =>
                this.chat.replaceSelectedContent(message.content)}"
              style="border-radius: 4px;border: 1px solid rgba(0,0,0,0.1);padding: 2px 6px;cursor: pointer"
            >
              replace
            </div>
            <div
              @click="${() =>
                this.chat.insertBelowSelectedContent(message.content)}"
              style="border-radius: 4px;border: 1px solid rgba(0,0,0,0.1);padding: 2px 6px;cursor: pointer"
            >
              insert below
            </div>
          </div>
        </div>
      `;
    }
    return null;
  };

  toolbar() {
    // const lastMessage = this.history[this.history.length - 1];
    // return html`<div
    //   style="display:flex;gap:12px;padding: 4px;font-size: 12px;line-height: 20px;color:var(--affine-text-secondary-color)"
    // >
    //   ${this.loading
    //     ? html`<div
    //         style="border-radius: 4px;border: 1px solid rgba(0,0,0,0.1);padding: 2px 8px 2px 4px;cursor: pointer;display:flex;align-items:center;gap: 4px;"
    //         @click="${() => (this.currentRequest = undefined)}"
    //       >
    //         ${StopIcon} Stop
    //       </div>`
    //     : nothing}
    //   ${!this.loading && lastMessage.role === 'assistant'
    //     ? html`<div
    //           style="border-radius: 4px;border: 1px solid rgba(0,0,0,0.1);padding: 2px 10px;cursor: pointer"
    //         >
    //           Longer
    //         </div>
    //         <div
    //           style="border-radius: 4px;border: 1px solid rgba(0,0,0,0.1);padding: 2px 10px;cursor: pointer"
    //         >
    //           Shorter
    //         </div>`
    //     : nothing}
    // </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'copilot-chat-panel': CopilotChatPanel;
  }
}
