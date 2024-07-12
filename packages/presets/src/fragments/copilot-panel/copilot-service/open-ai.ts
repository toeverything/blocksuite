import { html } from 'lit';
import { OpenAI } from 'openai';

import type { ChatMessage } from '../chat/logic.js';

import { pngBase64ToFile } from '../edgeless/edit-image.js';
import {
  ChatServiceKind,
  EmbeddingServiceKind,
  Image2TextServiceKind,
  Text2ImageServiceKind,
  TextServiceKind,
  createVendor,
} from './service-base.js';

export const openaiVendor = createVendor<{
  apiKey: string;
}>({
  color: '#202123',
  initData: () => ({ apiKey: '' }),
  key: 'OpenAI',
  renderConfigEditor: (data, refresh) => {
    return html`
      <div style="display:flex;flex-direction: column;gap: 12px;">
        <div>
          <label for="key">Key</label>
          <input
            type="text"
            id="key"
            .value="${data.apiKey}"
            @input="${(e: Event) => {
              const input = e.target as HTMLInputElement;
              data.apiKey = input.value;
              refresh();
            }}"
          />
        </div>
      </div>
    `;
  },
});
const toGPTMessages = (
  messages: ChatMessage[]
): Array<OpenAI.ChatCompletionMessageParam> => {
  return messages.map(v => {
    if (v.role === 'assistant') {
      return { content: v.content, role: v.role };
    }
    return v;
  });
};

const askGPT = async (
  apiKey: string,
  model:
    | 'gpt-3.5-turbo-1106'
    | 'gpt-4'
    | 'gpt-4-turbo'
    | 'gpt-4-vision-preview',
  messages: Array<ChatMessage>
) => {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
  const result = await openai.chat.completions.create({
    max_tokens: 4096,
    messages: toGPTMessages(messages),
    model: model,
    temperature: 0,
  });
  return result.choices[0].message;
};
const askGPTStream = async function* (
  apiKey: string,
  model:
    | 'gpt-3.5-turbo-1106'
    | 'gpt-4'
    | 'gpt-4-turbo'
    | 'gpt-4-vision-preview',
  messages: Array<ChatMessage>
): AsyncIterable<string> {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
  const result = await openai.chat.completions.create({
    max_tokens: 4096,
    messages: toGPTMessages(messages),
    model: model,
    stream: true,
    temperature: 0,
  });
  for await (const message of result) {
    yield message.choices[0].delta.content ?? '';
  }
};

TextServiceKind.implService({
  method: data => ({
    generateText: async messages => {
      const result = await askGPT(data.apiKey, 'gpt-3.5-turbo-1106', messages);
      return result.content ?? '';
    },
  }),
  name: 'GPT3.5 Turbo',
  vendor: openaiVendor,
});
TextServiceKind.implService({
  method: data => ({
    generateText: async messages => {
      const result = await askGPT(data.apiKey, 'gpt-4', messages);
      return result.content ?? '';
    },
  }),
  name: 'GPT4',
  vendor: openaiVendor,
});

ChatServiceKind.implService({
  method: data => ({
    chat: messages => {
      return askGPTStream(data.apiKey, 'gpt-3.5-turbo-1106', messages);
    },
  }),
  name: 'GPT3.5 Turbo',
  vendor: openaiVendor,
});

ChatServiceKind.implService({
  method: data => ({
    chat: messages => askGPTStream(data.apiKey, 'gpt-4', messages),
  }),
  name: 'GPT4',
  vendor: openaiVendor,
});
ChatServiceKind.implService({
  method: data => ({
    chat: messages =>
      askGPTStream(data.apiKey, 'gpt-4-vision-preview', messages),
  }),
  name: 'GPT4-Vision',
  vendor: openaiVendor,
});
Text2ImageServiceKind.implService({
  method: data => ({
    generateImage: async prompt => {
      const apiKey = data.apiKey;
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
      const result = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        response_format: 'b64_json',
      });
      return pngBase64ToFile(result.data[0].b64_json ?? '', 'img');
    },
  }),
  name: 'DALL-E3',
  vendor: openaiVendor,
});
const embeddings = async (apiKey: string, textList: string[]) => {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
  const result = await openai.embeddings.create({
    encoding_format: 'float',
    input: textList,
    model: 'text-embedding-ada-002',
  });
  return result.data.map(v => v.embedding);
};
EmbeddingServiceKind.implService({
  method: data => ({
    generateEmbedding: async text => {
      const result = await embeddings(data.apiKey, [text]);
      return result[0];
    },
    generateEmbeddings: async textList => {
      return embeddings(data.apiKey, textList);
    },
  }),
  name: 'Ada 002',
  vendor: openaiVendor,
});

Image2TextServiceKind.implService({
  method: data => ({
    generateText: async messages => {
      const apiKey = data.apiKey;
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
      const result = await openai.chat.completions.create({
        max_tokens: 4096,
        messages,
        model: 'gpt-4-vision-preview',
        temperature: 0,
      });
      return result.choices[0].message.content ?? '';
    },
  }),
  name: 'GPT4 Vision',
  vendor: openaiVendor,
});
