import type { ChatMessage } from '../chat/logic.js';
import { copilotConfig } from '../copilot-service/copilot-config.js';
import {
  ChatServiceKind,
  TextServiceKind,
} from '../copilot-service/service-base.js';

export const ChatFeatureKey = 'chat';
export const getTextService = () => {
  return copilotConfig.getService(ChatFeatureKey, TextServiceKind);
};
export const getChatService = () => {
  return copilotConfig.getService(ChatFeatureKey, ChatServiceKind);
};
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
