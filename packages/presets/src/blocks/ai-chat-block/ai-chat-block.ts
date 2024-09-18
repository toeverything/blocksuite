import { BlockComponent } from '@blocksuite/block-std';
import { Peekable } from '@blocksuite/blocks';
import { computed } from '@preact/signals-core';
import { html } from 'lit';

import type { AIChatBlockModel } from './ai-chat-model.js';

import { ChatWithAIIcon } from '../_common/icon.js';
import { AIChatBlockStyles } from './styles.js';
import { ChatMessagesSchema } from './types.js';

@Peekable({
  enableOn: ({ doc }: AIChatBlockComponent) => !doc.readonly,
})
export class AIChatBlockComponent extends BlockComponent<AIChatBlockModel> {
  static override styles = AIChatBlockStyles;

  // Deserialize messages from JSON string and verify the type using zod
  private _deserializeChatMessages = computed(() => {
    const messages = this.model.messages$.value;
    try {
      const result = ChatMessagesSchema.safeParse(JSON.parse(messages));
      if (result.success) {
        return result.data;
      } else {
        return [];
      }
    } catch {
      return [];
    }
  });

  override renderBlock() {
    const messages = this._deserializeChatMessages.value.slice(-2);
    const textRendererOptions = {
      customHeading: true,
    };

    return html`<div class="affine-ai-chat-block-container">
      <div class="ai-chat-messages-container">
        <ai-chat-messages
          .host=${this.host}
          .messages=${messages}
          .textRendererOptions=${textRendererOptions}
          .withMask=${true}
        ></ai-chat-messages>
      </div>
      <div class="ai-chat-block-button">
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
