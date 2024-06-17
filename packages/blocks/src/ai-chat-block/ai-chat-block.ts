/// <reference types="vite/client" />
import { BlockElement } from '@blocksuite/block-std';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { ChatWithAIIcon } from '../_common/icons/ai.js';
import type { AIChatBlockModel } from './ai-chat-model.js';
import { styles } from './styles.js';

@customElement('affine-ai-chat')
export class AIChatBlockComponent extends BlockElement<AIChatBlockModel> {
  static override styles = styles;

  open = () => {
    console.log('open chat block in center peek');
  };

  PlaceHolder = () => {
    return html`<div class="affine-ai-chat-block-container">
      <div class="chat-item">
        <div class="chat-user">
          <span class="user-avatar"></span>
          <span class="user-name">zanwei guo</span>
        </div>
        <div class="chat-message">
          You are an expert in popular writing in Xiaohongshu. Please use the
          the following steps to create and produce 1 text. After reading it
          completely and confirming that you follow all the requirements, please
          answer "I understand and am ready to accept input."
        </div>
      </div>
      <div class="chat-block-button">
        ${ChatWithAIIcon} <span>AI chat block</span>
      </div>
    </div>`;
  };

  override renderBlock() {
    const { items } = this.model;
    if (!items || items.length === 0) {
      return this.PlaceHolder();
    }

    const item = items[0];
    let content = `You are an expert in popular writing in Xiaohongshu. Please use the
      the following steps to create and produce 1 text. After reading it
      completely and confirming that you follow all the requirements, please
      answer "I understand and am ready to accept input."`;
    if ('role' in item) {
      content = item.content;
    }

    return html`<div class="affine-ai-chat-block-container">
      <div class="chat-item">
        <div class="chat-user">
          <span class="user-avatar"></span>
          <span class="user-name">zanwei guo</span>
        </div>
        <div class="chat-message">${content}</div>
      </div>
      <div class="chat-block-button">
        ${ChatWithAIIcon} <span>AI chat block</span>
      </div>
    </div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-ai-chat': AIChatBlockComponent;
  }
}
