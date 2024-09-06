import type { Signal } from '@preact/signals-core';
import type * as Y from 'yjs';

import { type Disposable, Slot } from '@blocksuite/global/utils';
import { computed, signal } from '@preact/signals-core';
import { z } from 'zod';

import type { YBlock } from '../store/doc/block/index.js';
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

type SignaledProps<Props> = Props & {
  [P in keyof Props & string as `${P}$`]: Signal<Props[P]>;
};
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
  PropsSignal extends object = SignaledProps<Props>,
> extends MagicProps()<PropsSignal> {
  private _childModels = computed(() => {
    const value: BlockModel[] = [];
    this._children.value.map(id => {
      const block = this.page.getBlock$(id);
      if (block) {
        value.push(block.model);
      }
    });
    return value;
  });

  private _children = signal<string[]>([]);

  private _onCreated: Disposable;

  private _onDeleted: Disposable;

  childMap = computed(() =>
    this._children.value.reduce((map, id, index) => {
      map.set(id, index);
      return map;
    }, new Map<string, number>())
  );

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

  get children() {
    return this._childModels.value;
  }

  get doc() {
    return this.page;
  }

  set doc(doc: Doc) {
    this.page = doc;
  }

  get parent() {
    return this.doc.getParent(this);
  }

  constructor() {
    super();
    this._onCreated = this.created.once(() => {
      this._children.value = this.yBlock.get('sys:children').toArray();
      this.yBlock.get('sys:children').observe(event => {
        this._children.value = event.target.toArray();
      });
      this.yBlock.observe(event => {
        if (event.keysChanged.has('sys:children')) {
          this._children.value = this.yBlock.get('sys:children').toArray();
        }
      });
    });
    this._onDeleted = this.deleted.once(() => {
      this._onCreated.dispose();
    });
  }

  dispose() {
    this.created.dispose();
    this.deleted.dispose();
    this.propsUpdated.dispose();
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

  [Symbol.dispose]() {
    this._onCreated.dispose();
    this._onDeleted.dispose();
  }
}
