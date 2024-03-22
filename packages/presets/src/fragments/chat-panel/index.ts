import './chat-panel-messages.js';
import './chat-panel-input.js';

import { WithDisposable } from '@blocksuite/block-std';
import type { RootService } from '@blocksuite/blocks';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { AffineEditorContainer } from '../../editors/index.js';
import { SmallHintIcon } from '../_common/icons.js';

@customElement('chat-panel')
export class ChatPanel extends WithDisposable(LitElement) {
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
      overflow-y: auto;
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

  get rootService() {
    return this.editor.host.std.spec.getService('affine:page');
  }

  get copilot(): RootService['copilot'] {
    return this.rootService.copilot;
  }

  override render() {
    const messages = this.copilot.history.history;

    return html` <div class="chat-panel-container">
      <div class="chat-panel-title">AFFINE AI</div>
      <chat-panel-messages
        .host=${this.editor.host}
        .copilot=${this.copilot}
      ></chat-panel-messages>
      ${messages.length === 0
        ? html`<div class="chat-panel-hints">
            <div>Start with current selection</div>
            <div>you've chosen within the doc</div>
          </div>`
        : nothing}
      <chat-panel-input
        .host=${this.editor.host}
        .copilot=${this.copilot}
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
