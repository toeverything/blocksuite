import type { BlockSpec } from '@blocksuite/block-std';
import type { BaseBlockTransformer } from '@blocksuite/store';
import { defineBlockSchema } from '@blocksuite/store';

import type { EmbedBlockModel } from './embed-block-model.js';
import type { EmbedBlockGeneratorOptions, EmbedProps } from './types.js';

export function createEmbedBlock<
  Props extends object,
  Model extends EmbedBlockModel<Props>,
  WidgetName extends string = string,
  Transformer extends BaseBlockTransformer<
    EmbedProps<Props>
  > = BaseBlockTransformer<EmbedProps<Props>>,
>({
  schema,
  service,
  view,
}: EmbedBlockGeneratorOptions<
  Props,
  Model,
  WidgetName,
  Transformer
>): BlockSpec {
  const blockSchema = defineBlockSchema({
    flavour: `affine:embed-${schema.name}`,
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

  return {
    schema: blockSchema,
    service,
    view,
  };
}
