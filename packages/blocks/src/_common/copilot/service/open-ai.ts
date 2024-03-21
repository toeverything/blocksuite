import { html } from 'lit';
import { OpenAI } from 'openai';

import type { ChatMessage } from '../model/message-schema.js';
import {
  ChatServiceKind,
  createVendor,
  EmbeddingServiceKind,
  Image2TextServiceKind,
  Text2ImageServiceKind,
  TextServiceKind,
} from './service-base.js';

export const pngBase64ToFile = (base64: string, filename: string) => {
  const bstr = atob(base64);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: 'image/png' });
};

export const openaiVendor = createVendor<{
  apiKey: string;
}>({
  key: 'OpenAI',
  color: '#202123',
  initData: () => ({ apiKey: '' }),
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
      return { role: v.role, content: v.content };
    }
    return v;
  });
};

const askGPT = async (
  apiKey: string,
  model:
    | 'gpt-4'
    | 'gpt-3.5-turbo-1106'
    | 'gpt-4-vision-preview'
    | 'gpt-4-turbo',
  messages: Array<ChatMessage>
) => {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
  const result = await openai.chat.completions.create({
    messages: toGPTMessages(messages),
    model: model,
    temperature: 0,
    max_tokens: 4096,
  });
  return result.choices[0].message;
};
const askGPTStream = async function* (
  apiKey: string,
  model:
    | 'gpt-4'
    | 'gpt-3.5-turbo-1106'
    | 'gpt-4-vision-preview'
    | 'gpt-4-turbo',
  messages: Array<ChatMessage>
): AsyncIterable<string> {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
  const result = await openai.chat.completions.create({
    stream: true,
    messages: toGPTMessages(messages),
    model: model,
    temperature: 0,
    max_tokens: 4096,
  });
  let text = '';
  for await (const message of result) {
    text += message.choices[0].delta.content ?? '';
    yield text;
  }
};

TextServiceKind.implService({
  name: 'GPT3.5 Turbo',
  method: data => ({
    generateText: async messages => {
      const result = await askGPT(data.apiKey, 'gpt-3.5-turbo-1106', messages);
      return result.content ?? '';
    },
  }),
  vendor: openaiVendor,
});
TextServiceKind.implService({
  name: 'GPT4',
  method: data => ({
    generateText: async messages => {
      const result = await askGPT(data.apiKey, 'gpt-4', messages);
      return result.content ?? '';
    },
  }),
  vendor: openaiVendor,
});

ChatServiceKind.implService({
  name: 'GPT3.5 Turbo',
  method: data => ({
    chat: messages => {
      return askGPTStream(data.apiKey, 'gpt-3.5-turbo-1106', messages);
    },
  }),
  vendor: openaiVendor,
});

ChatServiceKind.implService({
  name: 'GPT4',
  method: data => ({
    chat: messages => askGPTStream(data.apiKey, 'gpt-4', messages),
  }),
  vendor: openaiVendor,
});
ChatServiceKind.implService({
  name: 'GPT4-Vision',
  method: data => ({
    chat: messages =>
      askGPTStream(data.apiKey, 'gpt-4-vision-preview', messages),
  }),
  vendor: openaiVendor,
});
Text2ImageServiceKind.implService({
  name: 'DALL-E3',
  method: data => ({
    generateImage: async prompt => {
      const apiKey = data.apiKey;
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
      const result = await openai.images.generate({
        prompt,
        model: 'dall-e-3',
        response_format: 'b64_json',
      });
      return pngBase64ToFile(result.data[0].b64_json ?? '', 'img');
    },
  }),
  vendor: openaiVendor,
});
const embeddings = async (apiKey: string, textList: string[]) => {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
  const result = await openai.embeddings.create({
    input: textList,
    model: 'text-embedding-ada-002',
    encoding_format: 'float',
  });
  return result.data.map(v => v.embedding);
};
EmbeddingServiceKind.implService({
  name: 'Ada 002',
  method: data => ({
    generateEmbedding: async text => {
      const result = await embeddings(data.apiKey, [text]);
      return result[0];
    },
    generateEmbeddings: async textList => {
      return embeddings(data.apiKey, textList);
    },
  }),
  vendor: openaiVendor,
});

Image2TextServiceKind.implService({
  name: 'GPT4 Vision',
  method: data => ({
    async *generateText(messages) {
      const apiKey = data.apiKey;
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
      const result = await openai.chat.completions.create({
        messages,
        model: 'gpt-4-vision-preview',
        temperature: 0,
        max_tokens: 4096,
        stream: true,
      });
      let text = '';
      for await (const message of result) {
        text += message.choices[0].delta.content ?? '';
        yield text;
      }
    },
  }),
  vendor: openaiVendor,
});
