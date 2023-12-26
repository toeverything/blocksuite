import { html } from 'lit';
import { OpenAI } from 'openai';

import { askGPT3_5turbo } from '../utils/request.js';
import {
  EmbeddingServiceKind,
  Image2TextServiceKind,
  Text2ImageServiceKind,
  TextServiceKind,
} from './service-base.js';

TextServiceKind.implService<{
  apiKey: string;
  model: string;
}>({
  key: 'chat-gpt-text-service',
  initData: () => ({ apiKey: '', model: 'gpt-3.5-turbo-1106' }),
  method: data => ({
    generateText: async messages => {
      const result = await askGPT3_5turbo(data.apiKey, messages);
      return result.content ?? '';
    },
  }),
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
        <div>
          <label for="model">Model</label>
          <select
            id="model"
            .value="${data.model}"
            @input="${(e: Event) => {
              const input = e.target as HTMLSelectElement;
              data.model = input.value;
              refresh();
            }}"
          >
            <option value="gpt-4-1106-preview">gpt-4-1106-preview</option>
            <option value="gpt-4-vision-preview">gpt-4-vision-preview</option>
            <option value="gpt-4">gpt-4</option>
            <option value="gpt-4-0314">gpt-4-0314</option>
            <option value="gpt-4-0613">gpt-4-0613</option>
            <option value="gpt-4-32k">gpt-4-32k</option>
            <option value="gpt-4-32k-0314">gpt-4-32k-0314</option>
            <option value="gpt-4-32k-0613">gpt-4-32k-0613</option>
            <option value="gpt-3.5-turbo-1106">gpt-3.5-turbo-1106</option>
            <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            <option value="gpt-3.5-turbo-16k">gpt-3.5-turbo-16k</option>
            <option value="gpt-3.5-turbo-0301">gpt-3.5-turbo-0301</option>
            <option value="gpt-3.5-turbo-0613">gpt-3.5-turbo-0613</option>
            <option value="gpt-3.5-turbo-16k-0613">
              gpt-3.5-turbo-16k-0613
            </option>
          </select>
        </div>
      </div>
    `;
  },
});

Text2ImageServiceKind.implService<{
  apiKey: string;
  model: string;
}>({
  key: 'dalle-text-to-image-service',
  initData: () => ({ apiKey: '', model: 'dalle-3' }),
  method: data => ({
    generateImage: async prompt => {
      const apiKey = data.apiKey;
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
      const result = await openai.completions.create({
        prompt,
        model: 'dalle-3',
        temperature: 0,
        max_tokens: 4096,
      });
      return result.choices[0].text;
    },
  }),
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
        <div>
          <label for="model">Model</label>
          <select
            id="model"
            .value="${data.model}"
            @input="${(e: Event) => {
              const input = e.target as HTMLSelectElement;
              data.model = input.value;
              refresh();
            }}"
          >
            <option value="dalle-3">dalle-3</option>
            <option value="dalle-mini">dalle-mini</option>
          </select>
        </div>
      </div>
    `;
  },
});

EmbeddingServiceKind.implService<{
  apiKey: string;
  model: string;
}>({
  key: 'openai-embedding-service',
  initData: () => ({ apiKey: '', model: 'text-embedding-ada-002' }),
  method: data => ({
    generateEmbedding: async text => {
      const apiKey = data.apiKey;
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
      const result = await openai.embeddings.create({
        input: text,
        model: 'text-embedding-ada-002',
        encoding_format: 'float',
      });
      return result.data[0].embedding;
    },
    generateEmbeddings: async textList => {
      const apiKey = data.apiKey;
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
    },
  }),
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
        <div>
          <label for="model">Model</label>
          <select
            id="model"
            .value="${data.model}"
            @input="${(e: Event) => {
              const input = e.target as HTMLSelectElement;
              data.model = input.value;
              refresh();
            }}"
          >
            <option value="text-embedding-ada-002">
              text-embedding-ada-002
            </option>
          </select>
        </div>
      </div>
    `;
  },
});

Image2TextServiceKind.implService<{
  apiKey: string;
  model: string;
}>({
  key: 'gpt4v-image-to-text-service',
  initData: () => ({ apiKey: '', model: 'davinci' }),
  method: data => ({
    generateText: async messages => {
      const apiKey = data.apiKey;
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
      const result = await openai.chat.completions.create({
        messages: messages.map(v => ({ ...v, role: 'user' })),
        model: 'davinci',
        temperature: 0,
        max_tokens: 4096,
      });
      return result.choices[0].message.content ?? '';
    },
  }),
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
        <div>
          <label for="model">Model</label>
          <select
            id="model"
            .value="${data.model}"
            @input="${(e: Event) => {
              const input = e.target as HTMLSelectElement;
              data.model = input.value;
              refresh();
            }}"
          >
            <option value="davinci">davinci</option>
            <option value="curie">curie</option>
            <option value="babbage">babbage</option>
            <option value="ada">ada</option>
          </select>
        </div>
      </div>
    `;
  },
});
