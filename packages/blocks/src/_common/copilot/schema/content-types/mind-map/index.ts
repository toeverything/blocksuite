import { html } from 'lit';

import {
  type ContentSchema,
  createActionBuilder,
} from '../../message-schema.js';
import { chatService, userText } from '../utils.js';

type Markdown = string;
export const MindMapContentSchema: ContentSchema<Markdown, unknown> = {
  type: 'mind-map',
  render: ({ value }) => {
    if (value.status === 'loading') {
      return html`loading...`;
    }
    if (value.status === 'error') {
      return html` <div>${value.message}</div>`;
    }
    return html` <div style="white-space: pre-wrap">${value.data}</div>`;
  },
  toContext: (value: Markdown) => {
    return [
      {
        role: 'assistant',
        content: value,
        sources: [],
      },
    ];
  },
};

export const createMindMapAction = createActionBuilder('mind-map')((
  text: string
) => {
  return chatService().chat([
    userText(
      `Use the nested unordered list syntax in Markdown to create a structure similar to a mind map. 
      Analyze the following questions:
      ${text}`
    ),
  ]);
});
export const mindMapActions = {
  createMindMapAction,
};
