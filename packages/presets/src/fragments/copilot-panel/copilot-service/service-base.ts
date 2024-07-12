import type { TemplateResult } from 'lit';
import type { OpenAI } from 'openai';

import type { ChatMessage } from '../chat/logic.js';

export type Vendor<Data> = {
  color: string;
  initData: () => Data;
  key: string;
  renderConfigEditor: (data: Data, refresh: () => void) => TemplateResult;
};
export type ServiceImpl<M, Data> = {
  method: (data: Data) => M;
  name: string;
  vendor: Vendor<Data>;
};
export type ServiceKind<M> = {
  getImpl: (implName: string) => ServiceImpl<M, unknown> | undefined;
  implList: ServiceImpl<M, unknown>[];
  implService: <Data>(impl: ServiceImpl<M, Data>) => void;
  title: string;
  type: string;
};
export const createVendor = <Data extends object>(
  config: Vendor<Data>
): Vendor<Data> => {
  return config;
};
const createServiceKind = <M>(config: {
  title: string;
  type: string;
}): ServiceKind<M> => {
  const implList = [] as ServiceImpl<M, unknown>[];
  return {
    getImpl: implName => {
      return implList.find(v => v.name === implName);
    },
    implList,
    implService: impl => {
      implList.push(impl as never);
    },
    title: config.title,
    type: config.type,
  };
};

export const TextServiceKind = createServiceKind<{
  generateText(messages: ChatMessage[]): Promise<string>;
}>({
  title: 'Text service',
  type: 'text-service',
});
export const ChatServiceKind = createServiceKind<{
  chat(messages: Array<ChatMessage>): AsyncIterable<string>;
}>({
  title: 'Chat service',
  type: 'chat-service',
});

export const Text2ImageServiceKind = createServiceKind<{
  generateImage(prompt: string): Promise<File>;
}>({
  title: 'Text to image service',
  type: 'text-to-image-service',
});

export const EmbeddingServiceKind = createServiceKind<{
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(textList: string[]): Promise<number[][]>;
}>({
  title: 'Embedding service',
  type: 'embedding-service',
});

export const Image2TextServiceKind = createServiceKind<{
  generateText(
    messages: Array<OpenAI.ChatCompletionMessageParam>
  ): Promise<string>;
}>({
  title: 'Image to text service',
  type: 'image-to-text-service',
});

export const Image2ImageServiceKind = createServiceKind<{
  generateImage(prompt: string, image: string): Promise<string>;
}>({
  title: 'Image to image service',
  type: 'image-to-image-service',
});
export const FastImage2ImageServiceKind = createServiceKind<{
  createFastRequest(): (prompt: string, image: string) => Promise<string>;
}>({
  title: 'Fast image to image service',
  type: 'fast-image-to-image-service',
});

export const allKindService = [
  TextServiceKind,
  ChatServiceKind,
  Text2ImageServiceKind,
  Image2TextServiceKind,
  Image2ImageServiceKind,
  FastImage2ImageServiceKind,
  EmbeddingServiceKind,
];
export type AllServiceKind = (typeof allKindService)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GetMethod<Kind extends ServiceKind<any>> =
  Kind extends ServiceKind<infer M> ? M : never;
