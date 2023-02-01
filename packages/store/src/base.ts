import type { Page } from './workspace/index.js';
import type { TextType } from './text-adapter.js';
import { Signal } from '@blocksuite/global/utils';
import type * as Y from 'yjs';
import { z } from 'zod';

/**
 * @internal
 */
export const kValue = Symbol('kValue');

export interface InternalValue<Value = unknown> {
  __VALUE_HOLDER__?: Value;
  [kValue]: symbol;
}

export const RichTextType: InternalValue<TextType> = {
  [kValue]: Symbol('RichText'),
};

const FlavourSchema = z.string();
const TagSchema = z.object({
  _$litStatic$: z.string(),
  r: z.symbol(),
});

export const BlockSchema = z.object({
  version: z.number(),
  model: z.object({
    flavour: FlavourSchema,
    tag: TagSchema,
    props: z.function().returns(z.record(z.any())),
  }),
});

// ported from lit
interface StaticValue {
  _$litStatic$: string;
  r: symbol;
}

type Props<S extends Record<string, unknown>> = {
  [K in keyof S]: S[K] extends InternalValue<infer Value> ? Value : S[K];
};

export type SchemaToModel<
  Schema extends {
    model: {
      props: () => Record<string, unknown>;
      flavour: string;
    };
  }
> = BaseBlockModel &
  Props<ReturnType<Schema['model']['props']>> & {
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
  props: () => Props,
  metadata: Metadata
): {
  version: number;
  model: {
    props: () => Props;
    flavour: Flavour;
  } & Metadata;
};
export function defineBlockSchema(
  flavour: string,
  props: () => Record<string, unknown>,
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
  flavour!: keyof BlockSuiteInternal.BlockModels & string;
  tag!: StaticValue;
  id: string;

  page: Page;
  propsUpdated = new Signal();
  childrenUpdated = new Signal();
  childMap = new Map<string, number>();

  type?: string;
  children: BaseBlockModel[];
  // TODO use schema
  tags?: Y.Map<Y.Map<unknown>>;
  tagSchema?: Y.Map<unknown>;
  text?: TextType;
  sourceId?: string;

  // TODO: separate from model
  parentIndex?: number;
  index?: number;
  depth?: number;

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
