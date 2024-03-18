import type { ChatMessage } from '../../chat/logic.js';
import { copilotConfig } from '../../copilot-service/copilot-config.js';
import { ChatServiceKind } from '../../copilot-service/service-base.js';

const ChatFeatureKey = 'chat';
export const chatService = () =>
  copilotConfig.getService(ChatFeatureKey, ChatServiceKind);
export const userText = (text: string): ChatMessage => {
  return {
    role: 'user',
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
};
