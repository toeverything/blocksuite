import { html } from 'lit';

import {
  ChatServiceKind,
  TextServiceKind,
  createVendor,
} from './service-base.js';

export const llama2Vendor = createVendor<{
  host: string;
}>({
  color: '#202123',
  initData: () => ({ host: '' }),
  key: 'llama',
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
  method: data => ({
    generateText: async messages => {
      const result: {
        message: {
          content: string;
          role: string;
        };
      } = await fetch(`${data.host}/api/chat`, {
        body: JSON.stringify({
          messages: messages,
          model: 'llama2',
          stream: false,
        }),
        method: 'POST',
      }).then(res => res.json());
      return result.message.content;
    },
  }),
  name: 'llama2',
  vendor: llama2Vendor,
});

ChatServiceKind.implService({
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
            content: text,
            images: imgs,
            role: message.role,
          };
        }
        return message;
      });
      return (async function* () {
        const result: {
          message: {
            content: string;
            role: string;
          };
        } = await fetch(`${data.host}/api/chat`, {
          body: JSON.stringify({
            messages: llama2Messages,
            model: 'llama2',
            stream: false,
          }),
          method: 'POST',
        }).then(res => res.json());
        yield result.message.content;
      })();
    },
  }),
  name: 'llama2',
  vendor: llama2Vendor,
});
