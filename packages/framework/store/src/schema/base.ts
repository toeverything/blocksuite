import { Slot } from '@blocksuite/global/utils';
import type * as Y from 'yjs';
import { z } from 'zod';

import { Boxed } from '../reactive/boxed.js';
import { Text } from '../reactive/text.js';
import type { YBlock } from '../store/doc/block.js';
import type { Doc } from '../store/index.js';
import type { BaseBlockTransformer } from '../transformer/base.js';

const FlavourSchema = z.string();
const ParentSchema = z.array(z.string()).optional();
const ContentSchema = z.array(z.string()).optional();
const role = ['root', 'hub', 'content'] as const;
const RoleSchema = z.enum(role);

export type RoleType = (typeof role)[number];

export interface InternalPrimitives {
  Text: (input?: Y.Text | string) => Text;
  Boxed: <T>(input: T) => Boxed<T>;
}

export const internalPrimitives: InternalPrimitives = Object.freeze({
  Text: (input: Y.Text | string = '') => new Text(input),
  Boxed: <T>(input: T) => new Boxed(input),
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
    toModel: z.function().args().returns(z.custom<BlockModel>()).optional(),
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

export type SchemaToModel<
  Schema extends {
    model: {
      props: PropsGetter<object>;
      flavour: string;
    };
  },
> = BlockModel<ReturnType<Schema['model']['props']>> &
  ReturnType<Schema['model']['props']> & {
    flavour: Schema['model']['flavour'];
  };

export function defineBlockSchema<
  Flavour extends string,
  Role extends RoleType,
  Props extends object,
  Metadata extends Readonly<{
    version: number;
    role: Role;
    parent?: string[];
    children?: string[];
  }>,
  Model extends BlockModel<Props>,
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
  toModel?: () => BlockModel;
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
  return class {} as never;
}

const modelLabel = Symbol('model_label');

// @ts-ignore
export class BlockModel<
  Props extends object = object,
> extends MagicProps()<Props> {
  // This is used to avoid https://stackoverflow.com/questions/55886792/infer-typescript-generic-class-type
  [modelLabel]: Props = 'type_info_label' as never;

  version!: number;

  flavour!: string;

  role!: RoleType;

  /**
   * @deprecated use doc instead
   */
  page!: Doc;

  id!: string;

  yBlock!: YBlock;

  keys!: string[];

  stash!: (prop: keyof Props & string) => void;

  pop!: (prop: keyof Props & string) => void;

  // text is optional
  text?: Text;

  created = new Slot();

  deleted = new Slot();

  propsUpdated = new Slot<{ key: string }>();

  childrenUpdated = new Slot();

  get doc() {
    return this.page;
  }

  set doc(doc: Doc) {
    this.page = doc;
  }

  get childMap() {
    return this.children.reduce((map, child, index) => {
      map.set(child.id, index);
      return map;
    }, new Map<string, number>());
  }

  get children() {
    const block = this.yBlock.get('sys:children') as Y.Array<string>;
    if (!block) {
      return [];
    }

    const children: BlockModel[] = [];
    block.forEach(id => {
      const child = this.doc.getBlockById(id);
      if (!child) {
        return;
      }
      children.push(child);
    });

    return children;
  }

  isEmpty() {
    return this.children.length === 0;
  }

  firstChild(): BlockModel | null {
    return this.children[0] || null;
  }

  lastChild(): BlockModel | null {
    if (!this.children.length) {
      return this;
    }
    return this.children[this.children.length - 1].lastChild();
  }

  dispose() {
    this.created.dispose();
    this.deleted.dispose();
    this.propsUpdated.dispose();
    this.childrenUpdated.dispose();
  }
}
