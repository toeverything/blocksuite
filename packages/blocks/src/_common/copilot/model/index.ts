import '../service/index.js';

import { ChatHistory, type CopilotAction } from './chat-history.js';

export class Copilot {
  history: ChatHistory = new ChatHistory();

  askAI<Result>(action: CopilotAction<Result>, prompt: string) {
    return this.history.requestAssistantMessage(action, [
      { type: 'text', text: prompt },
    ]);
  }
}
