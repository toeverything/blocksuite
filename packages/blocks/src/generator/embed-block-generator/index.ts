import type { BlockSpec } from '@blocksuite/block-std';
import type {
  BaseBlockModel,
  BaseBlockTransformer,
  InternalPrimitives,
} from '@blocksuite/store';
import { defineBlockSchema } from '@blocksuite/store';

type Options<
  Props extends object,
  Model extends BaseBlockModel<Props> = BaseBlockModel<Props>,
  Transformer extends BaseBlockTransformer<Props> = BaseBlockTransformer<Props>,
> = {
  schema: {
    name: string;
    version: number;
    props?: (internalPrimitives: InternalPrimitives) => Props;
    toModel?: () => Model;
    transformer?: () => Transformer;
  };
};

type EmbedProps<Props> = Props & {
  xywh: string;
  index: string;
};

export function embedBlockGenerator<
  Props extends object,
  Model extends BaseBlockModel<EmbedProps<Props>> = BaseBlockModel<
    EmbedProps<Props>
  >,
  Transformer extends BaseBlockTransformer<
    EmbedProps<Props>
  > = BaseBlockTransformer<EmbedProps<Props>>,
>({ schema }: Options<Props, Model, Transformer>): BlockSpec {
  const blockSchema = defineBlockSchema({
    flavour: `affine:embed:${schema.name}`,
    props: internalPrimitives => {
      const userProps = schema.props?.(internalPrimitives);

      return {
        xywh: '[0,0,0,0]',
        index: 'a0',
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

  return {
    schema: blockSchema,
  };
}
