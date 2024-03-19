import { html } from 'lit';

import { createMessageSchema } from '../../message-schema.js';

type Text = string;
export const TextMessageSchema = createMessageSchema<string>({
  type: 'text',
  render: ({ value }) => {
    if (value.status === 'loading') {
      return html`loading...`;
    }
    if (value.status === 'error') {
      return html` <div>${value.message}</div>`;
    }
    return html` <div style="white-space: pre-wrap">${value.data}</div>`;
  },
  toContext: (value: Text) => {
    return [
      {
        role: 'assistant',
        content: value,
        sources: [],
      },
    ];
  },
});
