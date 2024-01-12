import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ChatServiceKind,
  EmbeddingServiceKind,
} from '../copilot-service/service-base.js';
import { ChatFeatureKey } from '../doc/api.js';
import type { AILogic } from '../logic.js';
import type { ChatMessage, ChatReactiveData, EmbeddedPage } from './logic.js';

@customElement('copilot-chat-panel')
export class CopilotChatPanel
  extends WithDisposable(ShadowlessElement)
  implements ChatReactiveData
{
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
      display: flex;
      gap: 8px;
      height: 30px;
      margin-top: 24px;
    }

    .copilot-chat-prompt {
      flex: 1;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      outline: none;
      background-color: white;
    }

    .send-button {
      width: 36px;
      background-color: var(--affine-primary-color);
      border-radius: 4px;
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

    .synced-page-list {
      margin-bottom: 14px;
      color: var(--affine-text-secondary-color);
      font-size: 12px;
    }

    .history-item {
      display: flex;
      flex-direction: column;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
    }

    .history-refs {
      font-size: 12px;
      color: var(--affine-text-secondary-color);
    }
  `;

  @property({ attribute: false })
  logic!: AILogic;
  get chat() {
    return this.logic.chat;
  }
  get editor() {
    return this.logic.editor;
  }
  @state()
  history: ChatMessage[] = [];
  @state()
  loading: boolean = false;

  @state()
  value = '';
  @state()
  syncedPages: EmbeddedPage[] = [];
  @state()
  surfaceSelection = false;
  @state()
  docSelection = false;

  public override connectedCallback() {
    super.connectedCallback();
    this.logic.chat.reactiveData = this;
    this.disposables.add(
      this.editor.page.workspace.slots.pagesUpdated.on(() => {
        this.requestUpdate();
      })
    );
    this.checkSelection();
    this.disposables.add(
      this.editor.host.selection.slots.changed.on(() => {
        this.checkSelection();
      })
    );
  }

  checkSelection() {
    this.surfaceSelection =
      this.editor.host.selection.value.find(v => v.type === 'surface') != null;
    this.docSelection =
      this.editor.host.selection.value.find(v => v.type === 'block') != null;
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
        alignItems: 'flex-end',
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
        backgroundColor: 'var(--affine-hover-color)',
      });
      return html` <div class="history-item" style="${style}">
        <div style="width: fit-content">${message.content}</div>
        ${message.sources?.length
          ? html` <div class="history-refs">
              <div style="margin-top: 8px;">sources:</div>
              <div
                style="display: flex;flex-direction: column;gap: 4px;padding: 4px;"
              >
                ${repeat(message.sources, ref => {
                  const page = this.editor.page.workspace.getPage(ref.id);
                  if (!page) {
                    return;
                  }
                  const title = page.meta.title || 'Untitled';
                  const jumpTo = () => {
                    this.editor.page = page;
                  };
                  return html` <a @click="${jumpTo}" style="cursor: pointer"
                    >${title}</a
                  >`;
                })}
              </div>
            </div>`
          : null}
        ${this.docSelection
          ? html`
              <div
                style="display:flex;align-items:center;gap: 8px;margin-top: 8px;user-select: none"
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
            `
          : null}
      </div>`;
    }
    return null;
  };
  @query('.copilot-chat-panel-chat-input')
  input!: HTMLInputElement;
  protected override render(): unknown {
    const getAnswer = async () => {
      this.input.focus();
      await this.chat.genAnswer();
    };
    const keydown = async (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        await getAnswer();
      }
    };
    const sendButtonStyle = styleMap({
      opacity: !this.loading ? '1' : '0.5',
    });
    return html`
      <div
        style="display:flex;flex-direction: column;justify-content: space-between;height: 100%"
      >
        <div>
          ${repeat(this.history, this.renderMessage)}
          <div class="copilot-chat-prompt-container">
            <input
              @keydown="${keydown}"
              autocomplete="off"
              data-1p-ignore
              type="text"
              class="copilot-chat-panel-chat-input copilot-chat-prompt"
              .value="${this.value}"
              @input="${(e: InputEvent) => {
                this.value = (e.target as HTMLInputElement).value;
              }}"
            />
            <div
              @click="${getAnswer}"
              style="${sendButtonStyle}"
              class="send-button"
            >
              <sl-icon name="stars"></sl-icon>
            </div>
          </div>
          ${this.surfaceSelection || this.docSelection
            ? html`<div
                @click="${this.addSelectionBackground}"
                style="border-radius: 4px;background-color: rgba(0,0,0,0.2);padding: 4px 8px;font-size: 12px;margin-top: 8px;width: max-content;cursor: pointer;user-select: none"
              >
                insert selected content
              </div>`
            : null}
        </div>
        <div>
          <div
            style="display:flex;flex-direction: column;gap: 12px;margin-bottom: 12px;"
          >
            <div style="display:flex;gap: 8px;flex-direction: column">
              <div
                style="font-size: 12px;color:var(--affine-text-secondary-color);"
              >
                embedding service:
              </div>
              <vendor-service-select
                .featureKey="${ChatFeatureKey}"
                .service="${EmbeddingServiceKind}"
              ></vendor-service-select>
            </div>
            <div style="display:flex;gap: 8px;flex-direction: column">
              <div
                style="font-size: 12px;color:var(--affine-text-secondary-color);"
              >
                chat service:
              </div>
              <vendor-service-select
                .featureKey="${ChatFeatureKey}"
                .service="${ChatServiceKind}"
              ></vendor-service-select>
            </div>
          </div>
          <div class="synced-page-list">
            <div style="margin-bottom: 8px;">Synced pages:</div>
            ${this.syncedPages.length
              ? repeat(this.syncedPages, page => {
                  const title =
                    this.editor.page.workspace.getPage(page.id)?.meta.title ??
                    'Untitled';
                  return html` <div>${title}</div>`;
                })
              : 'Empty'}
          </div>
          <div
            class="sync-workspace-button"
            style="margin-bottom: 12px"
            @click="${this.chat.syncWorkspace}"
          >
            Sync Workspace
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'copilot-chat-panel': CopilotChatPanel;
  }
}
