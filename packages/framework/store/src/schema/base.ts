import type * as Y from 'yjs';

import { type Disposable, Slot } from '@blocksuite/global/utils';
import { computed, signal } from '@preact/signals-core';
import { z } from 'zod';

import type { YBlock } from '../store/doc/block.js';
import type { Doc } from '../store/index.js';
import type { BaseBlockTransformer } from '../transformer/base.js';

import { Boxed } from '../reactive/boxed.js';
import { Text } from '../reactive/text.js';

const FlavourSchema = z.string();
const ParentSchema = z.array(z.string()).optional();
const ContentSchema = z.array(z.string()).optional();
const role = ['root', 'hub', 'content'] as const;
const RoleSchema = z.enum(role);

export type RoleType = (typeof role)[number];

export interface InternalPrimitives {
  Boxed: <T>(input: T) => Boxed<T>;
  Text: (input?: Y.Text | string) => Text;
}

export const internalPrimitives: InternalPrimitives = Object.freeze({
  Boxed: <T>(input: T) => new Boxed(input),
  Text: (input: Y.Text | string = '') => new Text(input),
});

export const BlockSchema = z.object({
  model: z.object({
    children: ContentSchema,
    flavour: FlavourSchema,
    parent: ParentSchema,
    props: z
      .function()
      .args(z.custom<InternalPrimitives>())
      .returns(z.record(z.any()))
      .optional(),
    role: RoleSchema,
    toModel: z.function().args().returns(z.custom<BlockModel>()).optional(),
  }),
  onUpgrade: z
    .function()
    .args(z.any(), z.number(), z.number())
    .returns(z.void())
    .optional(),
  transformer: z
    .function()
    .args()
    .returns(z.custom<BaseBlockTransformer>())
    .optional(),
  version: z.number(),
});

export type BlockSchemaType = z.infer<typeof BlockSchema>;

export type PropsGetter<Props> = (
  internalPrimitives: InternalPrimitives
) => Props;

export type SchemaToModel<
  Schema extends {
    model: {
      flavour: string;
      props: PropsGetter<object>;
    };
  },
> = {
  flavour: Schema['model']['flavour'];
} & BlockModel<ReturnType<Schema['model']['props']>> &
  ReturnType<Schema['model']['props']>;

export function defineBlockSchema<
  Flavour extends string,
  Role extends RoleType,
  Props extends object,
  Metadata extends Readonly<{
    children?: string[];
    parent?: string[];
    role: Role;
    version: number;
  }>,
  Model extends BlockModel<Props>,
  Transformer extends BaseBlockTransformer<Props>,
>(options: {
  flavour: Flavour;
  metadata: Metadata;
  onUpgrade?: (
    data: Props,
    previousVersion: number,
    latestVersion: number
  ) => void;
  props?: (internalPrimitives: InternalPrimitives) => Props;
  toModel?: () => Model;
  transformer?: () => Transformer;
}): {
  model: {
    flavour: Flavour;
    props: PropsGetter<Props>;
  } & Metadata;
  onUpgrade?: (
    data: Props,
    previousVersion: number,
    latestVersion: number
  ) => void;
  transformer?: () => Transformer;
  version: number;
};

export function defineBlockSchema({
  flavour,
  metadata,
  onUpgrade,
  props,
  toModel,
  transformer,
}: {
  flavour: string;
  metadata: {
    children?: string[];
    parent?: string[];
    role: RoleType;
    version: number;
  };
  onUpgrade?: (
    data: Record<string, unknown>,
    previousVersion: number,
    latestVersion: number
  ) => void;
  props?: (internalPrimitives: InternalPrimitives) => Record<string, unknown>;
  toModel?: () => BlockModel;
  transformer?: () => BaseBlockTransformer;
}): BlockSchemaType {
  const schema = {
    model: {
      children: metadata.children,
      flavour,
      parent: metadata.parent,
      props,
      role: metadata.role,
      toModel,
    },
    onUpgrade,
    transformer,
    version: metadata.version,
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
  private _children = signal<string[]>([]);

  private _onCreated: Disposable;

  private _onDeleted: Disposable;

  childMap = computed(() =>
    this._children.value.reduce((map, id, index) => {
      map.set(id, index);
      return map;
    }, new Map<string, number>())
  );

  childrenUpdated = new Slot();

  created = new Slot();

  deleted = new Slot();

  flavour!: string;

  id!: string;

  isEmpty = computed(() => {
    return this._children.value.length === 0;
  });

  keys!: string[];

  // This is used to avoid https://stackoverflow.com/questions/55886792/infer-typescript-generic-class-type
  [modelLabel]: Props = 'type_info_label' as never;

  /**
   * @deprecated use doc instead
   */
  page!: Doc;

  pop!: (prop: keyof Props & string) => void;

  propsUpdated = new Slot<{ key: string }>();

  role!: RoleType;

  stash!: (prop: keyof Props & string) => void;

  // text is optional
  text?: Text;

  version!: number;

  yBlock!: YBlock;

  constructor() {
    super();
    this._onCreated = this.created.once(() => {
      this._children.value = this.yBlock.get('sys:children').toArray();
      this.yBlock.get('sys:children').observe(event => {
        this._children.value = event.target.toArray();
      });
    });
    this._onDeleted = this.deleted.once(() => {
      this._onCreated.dispose();
    });
  }

  [Symbol.dispose]() {
    this._onCreated.dispose();
    this._onDeleted.dispose();
  }

  dispose() {
    this.created.dispose();
    this.deleted.dispose();
    this.propsUpdated.dispose();
    this.childrenUpdated.dispose();
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

  get children() {
    const value: BlockModel[] = [];
    this._children.value.forEach(id => {
      const block = this.page.getBlock(id);
      if (block) {
        value.push(block.model);
      }
    });
    return value;
  }

  get doc() {
    return this.page;
  }

  set doc(doc: Doc) {
    this.page = doc;
  }
}
