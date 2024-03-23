import '../service/index.js';

import { ChatManager, type CopilotAction } from './chat-manager.js';
import { actions } from './content-types/index.js';

export class Copilot {
  actions = actions;
  chat: ChatManager = new ChatManager();

  askAI<Result>(action: CopilotAction<Result>, prompt: string) {
    return this.chat.requestAssistantMessage(action, [
      { type: 'text', text: prompt },
    ]);
  }
}
