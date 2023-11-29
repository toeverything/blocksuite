import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

export type HtmlBlockProps = {
  html?: string;
  design?: string;
};

export const defaultHtmlBlockProps: HtmlBlockProps = {};

export const HtmlBlockSchema = defineBlockSchema({
  flavour: 'affine:html',
  props: (): HtmlBlockProps => defaultHtmlBlockProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note'],
  },
  toModel: () => new HtmlBlockModel(),
});

export class HtmlBlockModel extends BaseBlockModel<HtmlBlockProps> {}
