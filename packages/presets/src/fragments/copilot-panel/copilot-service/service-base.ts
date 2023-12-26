import type { TemplateResult } from 'lit';

export type ServiceImpl<M, Data> = {
  key: string;
  method: (data: Data) => M;
  initData: () => Data;
  renderConfigEditor: (data: Data, refresh: () => void) => TemplateResult;
};
export type ServiceKind<M> = {
  type: string;
  title: string;
  getImpl: (key: string) => ServiceImpl<M, unknown> | undefined;
  implList: ServiceImpl<M, unknown>[];
  implService: <Data>(impl: {
    key: string;
    method: (data: Data) => M;
    initData: () => Data;
    renderConfigEditor: (data: Data, refresh: () => void) => TemplateResult;
  }) => void;
};
const createServiceKind = <M>(config: {
  type: string;
  title: string;
}): ServiceKind<M> => {
  const implList = [] as ServiceImpl<M, unknown>[];
  return {
    type: config.type,
    title: config.title,
    getImpl: key => {
      return implList.find(v => v.key === key);
    },
    implList,
    implService: impl => {
      implList.push(impl as never);
    },
  };
};

type TextServiceMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};
export const TextServiceKind = createServiceKind<{
  generateText(messages: TextServiceMessage[]): Promise<string>;
}>({
  type: 'text-service',
  title: 'Text service',
});

export const Text2ImageServiceKind = createServiceKind<{
  generateImage(prompt: string): Promise<string>;
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
    messages: {
      type: 'text' | 'image';
      content: string;
    }[]
  ): Promise<string>;
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

export const allKindService = [
  TextServiceKind,
  Text2ImageServiceKind,
  EmbeddingServiceKind,
  Image2TextServiceKind,
  Image2ImageServiceKind,
];
export type AllServiceKind = (typeof allKindService)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GetMethod<Kind extends ServiceKind<any>> = Kind extends ServiceKind<
  infer M
>
  ? M
  : never;
