import { assertExists } from '@blocksuite/global/utils';
import { OpenAI } from 'openai';

import { EditorWithAI } from '../api.js';

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
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: img,
        prompt: prompt,
        sync_mode: true,
        seed: 42,
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
const getGPTAPIKey = () => {
  const apiKey = EditorWithAI.GPTAPIKey;
  if (!apiKey) {
    alert('Please enter your API key first.');
    assertExists(apiKey, 'Please enter your API key first.');
  }
  return apiKey;
};
const getFalAPIKey = () => {
  const apiKey = EditorWithAI.FalAPIKey;

  if (!apiKey) {
    alert('Please enter your API key first.');
    assertExists(apiKey, 'Please enter your API key first.');
  }
  return apiKey;
};
export const askGPT3_5turbo = async (
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
  return result.choices[0].message;
};
