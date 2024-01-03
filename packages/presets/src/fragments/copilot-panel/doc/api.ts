import { copilotConfig } from '../copilot-service/copilot-config.js';
import {
  ChatServiceKind,
  TextServiceKind,
} from '../copilot-service/service-base.js';

export const TextCompletionFeatureKey = 'text completion';
export const getTextService = () => {
  return copilotConfig.getService(TextCompletionFeatureKey, TextServiceKind);
};
export const getChatService = () => {
  return copilotConfig.getService(TextCompletionFeatureKey, ChatServiceKind);
};
