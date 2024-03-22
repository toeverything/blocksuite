import type { TemplateResult } from 'lit';
import type { OpenAI } from 'openai';

import type { ChatMessage, MessageContext } from '../model/message-schema.js';

export type Vendor<Data> = {
  key: string;
  color: string;
  initData: () => Data;
  renderConfigEditor: (data: Data, refresh: () => void) => TemplateResult;
};
export type ServiceImpl<M, Data> = {
  name: string;
  method: (data: Data) => M;
  vendor: Vendor<Data>;
};
export type ServiceKind<M> = {
  type: string;
  title: string;
  getImpl: (implName: string) => ServiceImpl<M, unknown> | undefined;
  implList: ServiceImpl<M, unknown>[];
  implService: <Data>(impl: ServiceImpl<M, Data>) => void;
};
export type CopilotServiceResult<Result> = (
  context: MessageContext,
  signal: AbortSignal
) => AsyncIterable<Result>;
export const createVendor = <Data extends object>(
  config: Vendor<Data>
): Vendor<Data> => {
  return config;
};
const createServiceKind = <M>(config: {
  type: string;
  title: string;
}): ServiceKind<M> => {
  const implList = [] as ServiceImpl<M, unknown>[];
  return {
    type: config.type,
    title: config.title,
    getImpl: implName => {
      return implList.find(v => v.name === implName);
    },
    implList,
    implService: impl => {
      implList.push(impl as never);
    },
  };
};

export const TextServiceKind = createServiceKind<{
  generateText(messages: ChatMessage[]): CopilotServiceResult<string>;
}>({
  type: 'text-service',
  title: 'Text service',
});
export const ChatServiceKind = createServiceKind<{
  chat(messages: Array<ChatMessage>): CopilotServiceResult<string>;
}>({
  type: 'chat-service',
  title: 'Chat service',
});

export const Text2ImageServiceKind = createServiceKind<{
  generateImage(prompt: string): Promise<File>;
}>({
  type: 'text-to-image-service',
  title: 'Text to image service',
});

export const EmbeddingServiceKind = createServiceKind<{
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(textList: string[]): Promise<number[][]>;
}>({
  type: 'embedding-service',
  title: 'Embedding service',
});

export const Image2TextServiceKind = createServiceKind<{
  generateText(
    messages: Array<OpenAI.ChatCompletionMessageParam>
  ): CopilotServiceResult<string>;
}>({
  type: 'image-to-text-service',
  title: 'Image to text service',
});

export const Image2ImageServiceKind = createServiceKind<{
  generateImage(prompt: string, image: string): Promise<string>;
}>({
  type: 'image-to-image-service',
  title: 'Image to image service',
});
export const FastImage2ImageServiceKind = createServiceKind<{
  createFastRequest(): (prompt: string, image: string) => Promise<string>;
}>({
  type: 'fast-image-to-image-service',
  title: 'Fast image to image service',
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
