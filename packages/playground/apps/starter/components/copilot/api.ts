import { OpenAI } from 'openai';

const USE_LOCAL = false;
// const USE_LOCAL = true; // for local debug toggling

const ENDPOINT = USE_LOCAL
  ? 'http://localhost:8787/api/copilot'
  : 'https://copilot-poc.toeverything.workers.dev/api/copilot';

export async function sendRequest(inputData: unknown) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(inputData),
  });

  if (!response.ok) throw new Error('Invalid network response');
  return response;
}

export type Uploadable = OpenAI.Images.ImageEditParams['image'];
export const askDallE3 = async (
  prompt: string,
  img?: Uploadable,
  mask?: Uploadable
) => {
  const apiKey = getGPTAPIKey();
  if (!apiKey) {
    alert('Please enter your API key first.');
    return;
  }
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
  if (!apiKey) {
    alert('Please enter your API key first.');
    return;
  }
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
  if (!apiKey) {
    alert('Please enter your API key first.');
    return;
  }
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
  return (document.getElementById('temp-gpt-api-key-input') as HTMLInputElement)
    .value;
};
const getFalAPIKey = () => {
  return (document.getElementById('temp-fal-api-key-input') as HTMLInputElement)
    .value;
};
