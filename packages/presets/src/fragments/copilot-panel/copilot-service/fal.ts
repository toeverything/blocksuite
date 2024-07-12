import * as fal from '@fal-ai/serverless-client';
import { html } from 'lit';

import { jpegBase64ToFile } from '../edgeless/edit-image.js';
import {
  FastImage2ImageServiceKind,
  Image2ImageServiceKind,
  Text2ImageServiceKind,
  createVendor,
} from './service-base.js';

export const falVendor = createVendor<{
  apiKey: string;
}>({
  color: '#5C4DD2',
  initData: () => ({ apiKey: '' }),
  key: 'Fal',
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
export const createImageGenerator = (apiKey: string) => {
  const connection = fal.realtime.connect('110602490-lcm-sd15-i2i', {
    onError: error => {
      console.error(error);
    },
    onResult: result => {
      const fn = requestMap.get(result.request_id);
      if (fn) {
        fn(result.images[0].url);
        requestMap.delete(result.request_id);
      }
    },
  });
  const requestMap = new Map<string, (img: string) => void>();
  let id = 0;
  return (prompt: string, img: string) => {
    return new Promise<string>(res => {
      fal.config({
        credentials: apiKey,
      });
      connection.send({
        enable_safety_checks: false,
        image_url: img,
        prompt,
        request_id: `${id++}`,
        sync_mode: true,
      });
      requestMap.set(id.toString(), res);
    });
  };
};
Image2ImageServiceKind.implService({
  method: ({ apiKey }) => ({
    generateImage: async (prompt, image) => {
      const data = await fetch(
        'https://110602490-lcm-sd15-i2i.gateway.alpha.fal.ai/',
        {
          body: JSON.stringify({
            enable_safety_checks: false,
            image_url: image,
            prompt: prompt,
            seed: 42,
            sync_mode: true,
          }),
          headers: {
            Authorization: `key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          method: 'post',
        }
      ).then(res => res.json());
      return data.images[0].url;
    },
  }),
  name: '110602490-lcm-sd15-i2i',
  vendor: falVendor,
});
Text2ImageServiceKind.implService({
  method: ({ apiKey }) => ({
    generateImage: async prompt => {
      fal.config({
        credentials: apiKey,
      });
      const result = (await fal.subscribe('110602490-fast-sdxl', {
        input: {
          prompt: prompt,
          sync_mode: true,
        },
      })) as { images: { url: string }[] };
      return jpegBase64ToFile(result.images[0].url, 'img');
    },
  }),
  name: '110602490-fast-sdxl',
  vendor: falVendor,
});
FastImage2ImageServiceKind.implService({
  method: data => ({
    createFastRequest: () => {
      const client = createImageGenerator(data.apiKey);
      return async (prompt, image) => {
        return client(prompt, image);
      };
    },
  }),
  name: 'lcm-sd15-i2i',
  vendor: falVendor,
});
