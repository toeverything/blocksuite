import { html } from 'lit';

import {
  ChatServiceKind,
  createVendor,
  TextServiceKind,
} from './service-base.js';

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
          role: string;
          content: string;
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

ChatServiceKind.implService({
  name: 'llama2',
  method: data => ({
    chat: messages => {
      const llama2Messages = messages.map(message => {
        if (message.role === 'user') {
          let text = '';
          const imgs: string[] = [];
          message.content.forEach(v => {
            if (v.type === 'text') {
              text += `${v.text}\n`;
            }
            if (v.type === 'image_url') {
              imgs.push(v.image_url.url.split(',')[1]);
            }
          });
          return {
            role: message.role,
            content: text,
            images: imgs,
          };
        }
        return message;
      });
      return (async function* () {
        const result: {
          message: {
            role: string;
            content: string;
          };
        } = await fetch(`${data.host}/api/chat`, {
          method: 'POST',
          body: JSON.stringify({
            model: 'llama2',
            messages: llama2Messages,
            stream: false,
          }),
        }).then(res => res.json());
        yield result.message.content;
      })();
    },
  }),
  vendor: llama2Vendor,
});
