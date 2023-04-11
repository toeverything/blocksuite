import type { BlockModels } from '@blocksuite/global/types';
import { Slot } from '@blocksuite/global/utils';
import * as Y from 'yjs';
import { z } from 'zod';

import { Text } from './text-adapter.js';
import type { Page } from './workspace/index.js';
import type { YBlock } from './workspace/page.js';

const FlavourSchema = z.string();
const ElementTagSchema = z.object({
  _$litStatic$: z.string(),
  r: z.symbol(),
});
const role = ['root', 'hub', 'content'] as const;
const RoleSchema = z.enum(role);

export type RoleType = (typeof role)[number];

export interface InternalPrimitives {
  Text: (input?: Y.Text | string) => Text;
  Map: <T>() => Y.Map<T>;
}

export const internalPrimitives: InternalPrimitives = Object.freeze({
  Text: (input: Y.Text | string = '') => new Text(input),
  Map: <T>() => new Y.Map<T>(),
});

export const BlockSchema = z.object({
  version: z.number(),
  model: z.object({
    role: RoleSchema,
    flavour: FlavourSchema,
    tag: ElementTagSchema,
    props: z
      .function()
      .args(z.custom<InternalPrimitives>())
      .returns(z.record(z.any()))
      .optional(),
    ext: z
      .function()
      .args(z.custom<InternalPrimitives>())
      .returns(z.record(z.any()))
      .optional(),
    toModel: z
      .function()
      .args(
        z.custom<{
          model: BaseBlockModel;
          block: YBlock;
          internal: InternalPrimitives;
        }>()
      )
      .returns(z.void())
      .optional(),
  }),
});

export type BlockSchemaType = z.infer<typeof BlockSchema>;

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
  Role extends RoleType,
  Props extends Record<string, unknown>,
  Ext extends Record<string, unknown>,
  Metadata extends Readonly<{
    version: number;
    tag: StaticValue;
  }>,
  Model extends BaseBlockModel & Props & Ext & { flavour: Flavour }
>(options: {
  flavour: Flavour;
  role: Role;
  metadata: Metadata;
  props?: (internalPrimitives: InternalPrimitives) => Props;
  ext?: (internalPrimitives: InternalPrimitives) => Ext;
  toModel?: (options: {
    model: Model;
    block: YBlock;
    internal: InternalPrimitives;
  }) => void;
}): {
  version: number;
  model: {
    role: Role;
    props: PropsGetter<Props>;
    ext: PropsGetter<Ext>;
    flavour: Flavour;
  } & Metadata;
};

export function defineBlockSchema({
  flavour,
  role,
  props,
  metadata,
  ext,
  toModel,
}: {
  flavour: string;
  role: RoleType;
  metadata: {
    version: number;
    tag: StaticValue;
  };
  props?: (internalPrimitives: InternalPrimitives) => Record<string, unknown>;
  ext?: (internalPrimitives: InternalPrimitives) => Record<string, unknown>;
  toModel?: (options: {
    model: BaseBlockModel;
    block: YBlock;
    internal: InternalPrimitives;
  }) => void;
}): BlockSchemaType {
  const schema = {
    version: metadata.version,
    model: {
      tag: metadata.tag,
      flavour,
      role,
      props,
      ext,
      toModel,
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
  role!: RoleType;
  id: string;

  page: Page;
  propsUpdated = new Slot();
  childrenUpdated = new Slot();
  childMap = new Map<string, number>();

  type?: string;
  children: BaseBlockModel[];
  // cells?: Y.Map<Y.Map<unknown>>;
  // columns?: Y.Map<unknown>;
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

  isEmpty() {
    return this.children.length === 0;
  }

  firstChild(): BaseBlockModel | null {
    return this.children[0] || null;
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
