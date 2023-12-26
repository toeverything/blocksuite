import { assertExists } from '@blocksuite/global/utils';
import * as fal from '@fal-ai/serverless-client';
import { OpenAI } from 'openai';

import { CopilotConfig } from '../copilot-service/copilot-config.js';

const getGPTAPIKey = () => {
  const apiKey = CopilotConfig.GPTAPIKey;
  if (!apiKey) {
    alert('Please enter your API key first.');
    throw new Error('Please enter your API key first.');
  }
  return apiKey;
};
const getFalAPIKey = () => {
  const apiKey = CopilotConfig.FalAPIKey;
  if (!apiKey) {
    alert('Please enter your API key first.');
    assertExists(apiKey, 'Please enter your API key first.');
  }
  return apiKey;
};

export const createImageGenerator = () => {
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
        credentials: getFalAPIKey(),
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
export type Uploadable = OpenAI.Images.ImageEditParams['image'];
export const askDallE3 = async (
  prompt: string,
  img?: Uploadable,
  mask?: Uploadable
) => {
  const apiKey = getGPTAPIKey();
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
  const result = await (img
    ? openai.images.edit({
        image: img,
        mask: mask,
        prompt,
        response_format: 'b64_json',
        model: 'dall-e-2',
      })
    : openai.images.generate({
        prompt,
        response_format: 'b64_json',
        model: 'dall-e-3',
      }));
  return result.data[0].b64_json;
};
export const ask110602490_lcm_sd15_i2i = async (
  prompt: string,
  img: string
) => {
  const apiKey = getFalAPIKey();
  const data = await fetch(
    'https://110602490-lcm-sd15-i2i.gateway.alpha.fal.ai/',
    {
      method: 'post',
      headers: {
        Authorization: `key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: img,
        prompt: prompt,
        sync_mode: true,
        seed: 42,
        enable_safety_checks: false,
      }),
    }
  ).then(res => res.json());
  return data.images[0].url;
};
export const askGPT4V = async (
  messages: Array<OpenAI.ChatCompletionMessageParam>
) => {
  const apiKey = getGPTAPIKey();
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
  const result = await openai.chat.completions.create({
    messages,
    model: 'gpt-4-vision-preview',
    temperature: 0,
    max_tokens: 4096,
  });
  return result.choices[0].message.content;
};
export const embeddings = async (textList: string[]) => {
  const apiKey = getGPTAPIKey();
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

export const askGPT3_5turbo = async (
  apiKey: string,
  messages: Array<OpenAI.ChatCompletionMessageParam>
) => {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
  const result = await openai.chat.completions.create({
    messages,
    model: 'gpt-3.5-turbo-1106',
    temperature: 0,
    max_tokens: 4096,
  });
  return result.choices[0].message;
};
export const askGPT3_5turbo_1106 = async (
  messages: Array<OpenAI.ChatCompletionMessageParam>
) => {
  const apiKey = getGPTAPIKey();
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
  const result = await openai.chat.completions.create({
    messages,
    model: 'gpt-3.5-turbo-1106',
    temperature: 0,
    max_tokens: 4096,
  });
  return result.choices[0].message.content;
};
