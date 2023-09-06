import { Slot } from '@blocksuite/global/utils';
import type * as Y from 'yjs';
import { z } from 'zod';

import type { BaseBlockTransformer } from '../transformer/base.js';
import type { Page } from '../workspace/index.js';
import type { YBlock } from '../workspace/page.js';
import { NativeWrapper } from '../yjs/native-wrapper.js';
import { Text } from '../yjs/text-adapter.js';

const FlavourSchema = z.string();
const ParentSchema = z.array(z.string()).optional();
const ContentSchema = z.array(z.string()).optional();
const role = ['root', 'hub', 'content'] as const;
const RoleSchema = z.enum(role);

export type RoleType = (typeof role)[number];

export interface InternalPrimitives {
  Text: (input?: Y.Text | string) => Text;
  Native: <T>(input: T) => NativeWrapper<T>;
}

export const internalPrimitives: InternalPrimitives = Object.freeze({
  Text: (input: Y.Text | string = '') => new Text(input),
  Native: <T>(input: T) => new NativeWrapper(input),
});

export const BlockSchema = z.object({
  version: z.number(),
  model: z.object({
    role: RoleSchema,
    flavour: FlavourSchema,
    parent: ParentSchema,
    children: ContentSchema,
    props: z
      .function()
      .args(z.custom<InternalPrimitives>())
      .returns(z.record(z.any()))
      .optional(),
    toModel: z.function().args().returns(z.custom<BaseBlockModel>()).optional(),
  }),
  transformer: z
    .function()
    .args()
    .returns(z.custom<BaseBlockTransformer>())
    .optional(),
  onUpgrade: z
    .function()
    .args(z.any(), z.number(), z.number())
    .returns(z.void())
    .optional(),
});

export type BlockSchemaType = z.infer<typeof BlockSchema>;

export type PropsGetter<Props> = (
  internalPrimitives: InternalPrimitives
) => Props;
export type PropsFromGetter<T> = T extends PropsGetter<infer Props>
  ? Props
  : never;

export type SchemaToModel<
  Schema extends {
    model: {
      props: PropsGetter<object>;
      flavour: string;
    };
  },
> = BaseBlockModel<PropsFromGetter<Schema['model']['props']>> &
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
    parent?: string[];
    children?: string[];
  }>,
  Model extends BaseBlockModel<Props>,
  Transformer extends BaseBlockTransformer<Props>,
>(options: {
  flavour: Flavour;
  metadata: Metadata;
  props?: (internalPrimitives: InternalPrimitives) => Props;
  onUpgrade?: (
    data: Props,
    previousVersion: number,
    latestVersion: number
  ) => void;
  toModel?: () => Model;
  transformer?: () => Transformer;
}): {
  version: number;
  model: {
    role: Role;
    props: PropsGetter<Props>;
    flavour: Flavour;
  } & Metadata;
  onUpgrade?: (
    data: Props,
    previousVersion: number,
    latestVersion: number
  ) => void;
  transformer?: () => Transformer;
};

export function defineBlockSchema({
  flavour,
  props,
  metadata,
  onUpgrade,
  toModel,
  transformer,
}: {
  flavour: string;
  metadata: {
    version: number;
    role: RoleType;
    parent?: string[];
    children?: string[];
  };
  props?: (internalPrimitives: InternalPrimitives) => Record<string, unknown>;
  onUpgrade?: (
    data: Record<string, unknown>,
    previousVersion: number,
    latestVersion: number
  ) => void;
  toModel?: () => BaseBlockModel;
  transformer?: () => BaseBlockTransformer;
}): BlockSchemaType {
  const schema = {
    version: metadata.version,
    model: {
      role: metadata.role,
      parent: metadata.parent,
      children: metadata.children,
      flavour,
      props,
      toModel,
    },
    onUpgrade,
    transformer,
  } satisfies z.infer<typeof BlockSchema>;
  BlockSchema.parse(schema);
  return schema;
}

/**
 * The MagicProps function is used to append the props to the class.
 * For example:
 *
 * ```ts
 * class MyBlock extends MagicProps()<{ foo: string }> {}
 * const myBlock = new MyBlock();
 * // You'll get type checking for the foo prop
 * myBlock.foo = 'bar';
 * ```
 */
function MagicProps(): {
  new <Props>(): Props;
} {
  // @ts-ignore
  return class {};
}

// @ts-ignore
export class BaseBlockModel<
  Props extends object = object,
> extends MagicProps()<Props> {
  static version: number;
  flavour!: string;
  role!: RoleType;
  page!: Page;
  id!: string;
  yBlock!: YBlock;
  keys!: string[];

  // text is optional
  text?: Text;

  created = new Slot();
  deleted = new Slot();
  propsUpdated = new Slot();
  childrenUpdated = new Slot();

  childMap = new Map<string, number>();
  children: BaseBlockModel[] = [];

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
    this.created.dispose();
    this.deleted.dispose();
    this.propsUpdated.dispose();
    this.childrenUpdated.dispose();
  }
}
