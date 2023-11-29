import type { BlockServiceConstructor } from '@blocksuite/block-std';
import type {
  BaseBlockModel,
  BaseBlockTransformer,
  InternalPrimitives,
} from '@blocksuite/store';

import type { EmbedModel } from './embed-block.js';

export type EmbedBlockGeneratorOptions<
  Props extends object,
  Model extends EmbedModel<Props>,
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

export type EmbedProps<Props = object> = Props & {
  rotate: number;
  xywh: string;
  index: string;
};

export type BaseEmbedBlockModel<Props extends object = object> = BaseBlockModel<
  EmbedProps<Props>
>;
