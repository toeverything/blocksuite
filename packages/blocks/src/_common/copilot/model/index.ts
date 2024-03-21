import '../service/index.js';

import { ChatHistory, type CopilotAction } from './chat-history.js';
import { actions } from './message-type/index.js';

export class Copilot {
  actions = actions;
  history: ChatHistory = new ChatHistory();

  askAI<Result>(action: CopilotAction<Result>, prompt: string) {
    return this.history.requestAssistantMessage(action, [
      { type: 'text', text: prompt },
    ]);
  }
}
