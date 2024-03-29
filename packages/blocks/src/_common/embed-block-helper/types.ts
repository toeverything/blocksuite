import type { BlockServiceConstructor } from '@blocksuite/block-std';
import type {
  BaseBlockTransformer,
  InternalPrimitives,
} from '@blocksuite/store';

import type { EdgelessSelectableProps } from '../edgeless/mixin/index.js';
import type { EmbedBlockModel } from './embed-block-model.js';

export type EmbedBlockGeneratorOptions<
  Props extends object,
  Model extends EmbedBlockModel<Props>,
  WidgetName extends string = string,
  Transformer extends BaseBlockTransformer<Props> = BaseBlockTransformer<Props>,
> = {
  schema: {
    name: string;
    version: number;
    toModel: () => Model;
    props?: (internalPrimitives: InternalPrimitives) => Props;
    transformer?: () => Transformer;
  };
  service?: BlockServiceConstructor;
  view: {
    component: BlockSuite.Component;
    widgets?: Record<WidgetName, BlockSuite.Component>;
  };
};

export type EmbedProps<Props = object> = Props & EdgelessSelectableProps;

export type LinkPreviewData = {
  description: string | null;
  icon: string | null;
  image: string | null;
  title: string | null;
};

export type LinkPreviewResponseData = {
  url: string;
  title?: string;
  siteName?: string;
  description?: string;
  images?: string[];
  mediaType?: string;
  contentType?: string;
  charset?: string;
  videos?: string[];
  favicons?: string[];
};
