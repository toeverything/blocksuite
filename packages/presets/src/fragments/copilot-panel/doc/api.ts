import type { ChatMessage } from '../chat/logic.js';

import { copilotConfig } from '../copilot-service/copilot-config.js';
import { ChatServiceKind } from '../copilot-service/service-base.js';

export const ChatFeatureKey = 'chat';
export const getChatService = () => {
  return copilotConfig.getService(ChatFeatureKey, ChatServiceKind);
};
export const userText = (text: string): ChatMessage => {
  return {
    content: [
      {
        text,
        type: 'text',
      },
    ],
    role: 'user',
  };
};
