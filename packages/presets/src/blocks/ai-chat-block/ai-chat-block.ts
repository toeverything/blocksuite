import { BlockElement } from '@blocksuite/block-std';
import { Peekable, peek } from '@blocksuite/blocks';
import { computed } from '@lit-labs/preact-signals';
import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { AIChatBlockModel } from './ai-chat-model.js';

import { AffineAIIcon, ChatWithAIIcon } from '../_common/icon.js';
import './components/chat-image.js';
import './components/text-renderer.js';
import './components/user-info.js';
import { styles } from './styles.js';
import { type ChatMessage, ChatMessagesSchema } from './types.js';

@customElement('affine-ai-chat')
@Peekable()
export class AIChatBlockComponent extends BlockElement<AIChatBlockModel> {
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

  private _openChatBlock = () => {
    peek(this);
  };

  static override styles = styles;

  ChatImages(attachments: string[] | undefined) {
    if (!attachments || attachments.length === 0) {
      return nothing;
    }

    return html`<div class="images-container">
      ${repeat(
        attachments,
        attachment => attachment,
        attachment =>
          html`<chat-image
            .imageUrl=${attachment}
            .status=${'success'}
          ></chat-image>`
      )}
    </div>`;
  }

  UserInfo(message: ChatMessage) {
    const isUser = 'role' in message && message.role === 'user';

    const userInfoTemplate = isUser
      ? html`<user-info
          .userName=${message.userName ?? 'You'}
          .avatarUrl=${message.avatarUrl}
        ></user-info>`
      : html`<user-info
          .userName=${'AFFiNE AI'}
          .avatarIcon=${AffineAIIcon}
        ></user-info>`;

    return userInfoTemplate;
  }

  override renderBlock() {
    const messages = this._deserializeChatMessages.value.slice(-2);
    const textRendererOptions = {
      customHeading: true,
    };

    return html`<div class="affine-ai-chat-block-container">
      <div class="ai-chat-messages">
        ${repeat(
          messages,
          message => message.id,
          message => html`
            <div class="ai-chat-message">
              ${this.UserInfo(message)}
              <div class="ai-chat-content">
                ${this.ChatImages(message.attachments)}
                <text-renderer
                  .host=${this.host}
                  .answer=${message.content}
                  .options=${textRendererOptions}
                  .state=${'finished'}
                ></text-renderer>
              </div>
            </div>
          `
        )}
      </div>
      <div class="ai-chat-block-button" @click=${this._openChatBlock}>
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
