import {
  ChatHistory,
  type CopilotAction,
  type MessageSchema,
} from './chat-history.js';

export class Copilot {
  history: ChatHistory = new ChatHistory();

  askAI<Result>(
    schema: MessageSchema<Result>,
    action: CopilotAction<Result>,
    prompt: string
  ) {
    this.history.addUserMessage([{ type: 'text', text: prompt }]);
    this.history.addAssistantMessage(schema, action);
  }
}
