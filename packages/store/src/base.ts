import type { BlockModels } from '@blocksuite/global/types';
import { Slot } from '@blocksuite/global/utils';
import type * as Y from 'yjs';
import { z } from 'zod';

import { Text } from './text-adapter.js';
import type { Page } from './workspace/index.js';

const FlavourSchema = z.string();
const ElementTagSchema = z.object({
  _$litStatic$: z.string(),
  r: z.symbol(),
});

export interface InternalPrimitives {
  Text: (input?: Y.Text | string) => Text;
}

export const internalPrimitives: InternalPrimitives = Object.freeze({
  Text: (input: Y.Text | string = '') => new Text(input),
});

export const BlockSchema = z.object({
  version: z.number(),
  model: z.object({
    flavour: FlavourSchema,
    tag: ElementTagSchema,
    props: z
      .function()
      .args(z.custom<InternalPrimitives>())
      .returns(z.record(z.any())),
  }),
});

export type PropsSetter<Props extends Record<string, unknown>> = (
  props: Props
) => Partial<Props>;
export type PropsGetter<Props extends Record<string, unknown>> = (
  internalPrimitives: InternalPrimitives
) => Props;

// ported from lit
interface StaticValue {
  _$litStatic$: string;
  r: symbol;
}

export type SchemaToModel<
  Schema extends {
    model: {
      props: PropsGetter<Record<string, unknown>>;
      flavour: string;
    };
  }
> = BaseBlockModel &
  ReturnType<Schema['model']['props']> & {
    flavour: Schema['model']['flavour'];
  };

export function defineBlockSchema<
  Flavour extends string,
  Props extends Record<string, unknown>,
  Metadata extends Readonly<{
    version: number;
    tag: StaticValue;
  }>
>(
  flavour: Flavour,
  props: (internalPrimitives: InternalPrimitives) => Props,
  metadata: Metadata
): {
  version: number;
  model: {
    props: PropsGetter<Props>;
    flavour: Flavour;
  } & Metadata;
};

export function defineBlockSchema(
  flavour: string,
  props: (internalPrimitives: InternalPrimitives) => Record<string, unknown>,
  metadata: {
    version: number;
    tag: StaticValue;
  }
): z.infer<typeof BlockSchema> {
  const schema = {
    version: metadata.version,
    model: {
      flavour,
      tag: metadata.tag,
      props,
    },
  } satisfies z.infer<typeof BlockSchema>;
  BlockSchema.parse(schema);
  return schema;
}

export class BaseBlockModel<Props = unknown>
  implements BlockSuiteInternal.IBaseBlockProps
{
  static version: number;
  flavour!: keyof BlockModels & string;
  tag!: StaticValue;
  id: string;

  page: Page;
  propsUpdated = new Slot();
  childrenUpdated = new Slot();
  childMap = new Map<string, number>();

  type?: string;
  children: BaseBlockModel[];
  // TODO use schema
  columns?: Y.Map<Y.Map<unknown>>;
  columnSchema?: Y.Map<unknown>;
  text?: Text;
  sourceId?: string;

  constructor(
    page: Page,
    props: Pick<BlockSuiteInternal.IBaseBlockProps, 'id'>
  ) {
    this.page = page;
    this.id = props.id;
    this.children = [];
  }

  firstChild() {
    const children = this.children;
    if (!children?.length) {
      return null;
    }
    return children[0];
  }

  lastChild(): BaseBlockModel | null {
    if (!this.children.length) {
      return this;
    }
    return this.children[this.children.length - 1].lastChild();
  }

  dispose() {
    this.propsUpdated.dispose();
    this.childrenUpdated.dispose();
  }
}
