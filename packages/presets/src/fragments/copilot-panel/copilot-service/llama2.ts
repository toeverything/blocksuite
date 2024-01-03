import { html } from 'lit';

import { createVendor, TextServiceKind } from './service-base.js';

export const llama2Vendor = createVendor<{
  host: string;
}>({
  key: 'llama',
  color: '#202123',
  initData: () => ({ host: '' }),
  renderConfigEditor: (data, refresh) => {
    return html`
      <div style="display:flex;flex-direction: column;gap: 12px;">
        <div>
          <label for="key">Host</label>
          <input
            type="text"
            id="key"
            .value="${data.host}"
            @input="${(e: Event) => {
              const input = e.target as HTMLInputElement;
              data.host = input.value;
              refresh();
            }}"
          />
        </div>
      </div>
    `;
  },
});
TextServiceKind.implService({
  name: 'llama2',
  method: data => ({
    generateText: async messages => {
      const result: {
        message: {
          role: 'assistant';
          content: 'Hello! How are you today?';
        };
      } = await fetch(`${data.host}/api/chat`, {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama2',
          messages: messages,
          stream: false,
        }),
      }).then(res => res.json());
      return result.message.content;
    },
  }),
  vendor: llama2Vendor,
});
