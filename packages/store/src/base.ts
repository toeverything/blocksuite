import { Slot } from '@blocksuite/global/utils';
import type * as Y from 'yjs';
import { z } from 'zod';

import { Text } from './text-adapter.js';
import type { Page } from './workspace/index.js';
import type { YBlock } from './workspace/page.js';

const FlavourSchema = z.string();
const ElementTagSchema = z.object({
  _$litStatic$: z.string(),
  r: z.symbol(),
});
const ParentSchema = z.array(z.string()).optional();
const ContentSchema = z.array(z.string()).optional();
const role = ['root', 'hub', 'content'] as const;
const RoleSchema = z.enum(role);

export type RoleType = (typeof role)[number];

export interface InternalPrimitives {
  Text: (input?: Y.Text | string) => Text;
}

export const internalPrimitives: InternalPrimitives = Object.freeze({
  Text: (input: Y.Text | string = '') => new Text(input),
});

export const BlockSchema = z.object({
  version: z.number(),
  model: z.object({
    role: RoleSchema,
    flavour: FlavourSchema,
    tag: ElementTagSchema,
    parent: ParentSchema,
    children: ContentSchema,
    props: z
      .function()
      .args(z.custom<InternalPrimitives>())
      .returns(z.record(z.any()))
      .optional(),
    toModel: z.function().args().returns(z.custom<BaseBlockModel>()).optional(),
  }),
});

export type BlockSchemaType = z.infer<typeof BlockSchema>;

export type PropsSetter<Props> = (props: Props) => Partial<Props>;
export type PropsGetter<Props> = (
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
      props: PropsGetter<object>;
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
  Props extends object,
  Ext extends Record<string, unknown>,
  Metadata extends Readonly<{
    version: number;
    role: Role;
    tag: StaticValue;
    parent?: string[];
    children?: string[];
  }>,
  Model extends BaseBlockModel<Props>
>(options: {
  flavour: Flavour;
  metadata: Metadata;
  props?: (internalPrimitives: InternalPrimitives) => Props;
  toModel?: () => Model;
}): {
  version: number;
  model: {
    role: Role;
    props: PropsGetter<Props>;
    flavour: Flavour;
  } & Metadata;
};

export function defineBlockSchema({
  flavour,
  props,
  metadata,
  toModel,
}: {
  flavour: string;
  metadata: {
    version: number;
    role: RoleType;
    tag: StaticValue;
    parent?: string[];
    children?: string[];
  };
  props?: (internalPrimitives: InternalPrimitives) => Record<string, unknown>;
  toModel?: () => BaseBlockModel;
}): BlockSchemaType {
  const schema = {
    version: metadata.version,
    model: {
      tag: metadata.tag,
      role: metadata.role,
      parent: metadata.parent,
      children: metadata.children,
      flavour,
      props,
      toModel,
    },
  } satisfies z.infer<typeof BlockSchema>;
  BlockSchema.parse(schema);
  return schema;
}

function MagicProps(): {
  new <Props>(): Props;
} {
  // @ts-ignore
  return class {};
}

// @ts-ignore
export class BaseBlockModel<
  Props extends object = object
> extends MagicProps()<Props> {
  static version: number;
  flavour!: string;
  tag!: StaticValue;
  role!: RoleType;
  page!: Page;
  id!: string;
  yBlock!: YBlock;

  propsUpdated = new Slot();
  childrenUpdated = new Slot();
  childMap = new Map<string, number>();

  children: BaseBlockModel[] = [];

  // TODO: remove these
  type?: string;
  text?: Text;
  sourceId?: string;

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

  firstItem(): BaseBlockModel | null {
    if (!this.children.length) {
      return this;
    }
    return this.children[0];
  }

  lastItem(): BaseBlockModel | null {
    if (!this.children.length) {
      return this;
    }
    return this.children[this.children.length - 1];
  }

  dispose() {
    this.propsUpdated.dispose();
    this.childrenUpdated.dispose();
  }

  onCreated() {
    // Empty by default
  }
}
