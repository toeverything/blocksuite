import type { ChatMessage } from '../chat/logic.js';
import { copilotConfig } from '../copilot-service/copilot-config.js';
import {
  ChatServiceKind,
  Image2TextServiceKind,
} from '../copilot-service/service-base.js';

export const ChatFeatureKey = 'chat';
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

export const getImage2TextService = (key = 'make it real') => {
  return copilotConfig.getService(key, Image2TextServiceKind);
};
export const userImage = (url: string): ChatMessage => {
  return {
    role: 'user',
    content: [
      {
        type: 'image_url',
        image_url: {
          detail: 'high',
          url,
        },
      },
    ],
  };
};
