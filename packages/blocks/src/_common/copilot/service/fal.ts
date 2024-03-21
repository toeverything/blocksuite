import * as fal from '@fal-ai/serverless-client';
import { html } from 'lit';

import {
  createVendor,
  FastImage2ImageServiceKind,
  Image2ImageServiceKind,
  Text2ImageServiceKind,
} from './service-base.js';

export const jpegBase64ToFile = (base64: string, filename: string) => {
  const bstr = atob(base64.split(',')[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {
    type: 'image/jpeg',
  });
};

export const falVendor = createVendor<{
  apiKey: string;
}>({
  key: 'Fal',
  color: '#5C4DD2',
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
export const createImageGenerator = (apiKey: string) => {
  const connection = fal.realtime.connect('110602490-lcm-sd15-i2i', {
    onResult: result => {
      const fn = requestMap.get(result.request_id);
      if (fn) {
        fn(result.images[0].url);
        requestMap.delete(result.request_id);
      }
    },
    onError: error => {
      console.error(error);
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
        request_id: `${id++}`,
        prompt,
        sync_mode: true,
        enable_safety_checks: false,
        image_url: img,
      });
      requestMap.set(id.toString(), res);
    });
  };
};
Image2ImageServiceKind.implService({
  name: '110602490-lcm-sd15-i2i',
  method: ({ apiKey }) => ({
    generateImage: async (prompt, image) => {
      const data = await fetch(
        'https://110602490-lcm-sd15-i2i.gateway.alpha.fal.ai/',
        {
          method: 'post',
          headers: {
            Authorization: `key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: image,
            prompt: prompt,
            sync_mode: true,
            seed: 42,
            enable_safety_checks: false,
          }),
        }
      ).then(res => res.json());
      return data.images[0].url;
    },
  }),
  vendor: falVendor,
});
Text2ImageServiceKind.implService({
  name: '110602490-fast-sdxl',
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
  vendor: falVendor,
});
FastImage2ImageServiceKind.implService({
  name: 'lcm-sd15-i2i',
  method: data => ({
    createFastRequest: () => {
      const client = createImageGenerator(data.apiKey);
      return async (prompt, image) => {
        return client(prompt, image);
      };
    },
  }),
  vendor: falVendor,
});
