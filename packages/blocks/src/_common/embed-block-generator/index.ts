import type { BlockServiceConstructor, BlockSpec } from '@blocksuite/block-std';
import type {
  BaseBlockModel,
  BaseBlockTransformer,
  InternalPrimitives,
} from '@blocksuite/store';
import { defineBlockSchema } from '@blocksuite/store';

import type { EmbedModel } from './embed-block.js';

type Options<
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

export function embedBlockGenerator<
  Props extends object,
  Model extends EmbedModel<Props>,
  WidgetName extends string = string,
  Transformer extends BaseBlockTransformer<
    EmbedProps<Props>
  > = BaseBlockTransformer<EmbedProps<Props>>,
>({
  schema,
  service,
  view,
}: Options<Props, Model, WidgetName, Transformer>): BlockSpec {
  const blockSchema = defineBlockSchema({
    flavour: `affine:embed:${schema.name}`,
    props: internalPrimitives => {
      const userProps = schema.props?.(internalPrimitives);

      return {
        xywh: '[0,0,0,0]',
        index: 'a0',
        rotate: 0,
        ...(userProps || {}),
      } as EmbedProps<Props>;
    },
    metadata: {
      version: schema.version,
      role: 'content',
    },
    toModel: schema.toModel,
    transformer: schema.transformer,
  });

  const spec: BlockSpec = {
    schema: blockSchema,
    service,
    view,
  };

  return spec;
}
