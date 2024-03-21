import { createMessageSchema } from '../../message-schema.js';
import { textRenderer } from './renderer.js';

type Text = string;
export const TextMessageSchema = createMessageSchema<string>({
  type: 'text',
  render: textRenderer,
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
