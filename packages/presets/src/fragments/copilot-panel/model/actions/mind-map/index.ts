import { html } from 'lit';

import {
  type CopilotActionFromSchema,
  createMessageSchema,
} from '../../chat-history.js';
import { chatService, userText } from '../base.js';

export const MindMapMessageSchema = createMessageSchema<string>({
  render: ({ value }) => {
    if (value.status === 'loading') {
      return html`loading...`;
    }
    if (value.status === 'error') {
      return html` <div>${value.message}</div>`;
    }
    return html` <div>${value.data}</div>`;
  },
  toContext: (value: string) => {
    return [
      {
        role: 'assistant',
        content: value,
        sources: [],
      },
    ];
  },
});

export const createMindMap =
  (text: string): CopilotActionFromSchema<typeof MindMapMessageSchema> =>
  context => {
    return chatService.chat([
      ...context.history,
      userText(
        `Use the nested unordered list syntax in Markdown to create a structure similar to a mind map. 
      Analysis the following questions:
      ${text}`
      ),
    ]);
  };
