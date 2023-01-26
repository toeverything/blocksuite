import type { Page } from './workspace/index.js';
import type { TextType } from './text-adapter.js';
import { Signal } from '@blocksuite/global/utils';
import type * as Y from 'yjs';
import { z } from 'zod';

const FlavourSchema = z.string();
const TagSchema = z.object({
  _$litStatic$: z.string(),
  r: z.symbol(),
});

const StateSchema = z.any();
const MethodSchema = z.function(z.tuple([]).rest(z.any()));
const SetFunctionSchema = z.function(z.tuple([z.record(z.any())]));
const GetFunctionSchema = z.function(z.tuple([]), StateSchema);
const MethodsSchema = z
  .function()
  .args(GetFunctionSchema, SetFunctionSchema)
  .returns(z.record(MethodSchema));

export const BlockSchema = z.object({
  version: z.number(),
  model: z.object({
    flavour: FlavourSchema,
    tag: TagSchema,
    state: StateSchema,
    methods: MethodsSchema,
  }),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;
type VoidFunction = () => void;
type Listener<State> = (state: State, prevState: State) => void;
// @ts-expect-error
type Subscribe<State> = (listener: Listener<State>) => VoidFunction;

// ported from lit
interface StaticValue {
  _$litStatic$: string;
  r: symbol;
}

export type Model<
  Schema extends {
    model: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state: Record<string, any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      methods: (...args: any[]) => Record<string, AnyFunction>;
      flavour: string;
    };
  }
> = BaseBlockModel &
  Schema['model']['state'] &
  ReturnType<Schema['model']['methods']> & {
    flavour: Schema['model']['flavour'];
  };

export function defineBlockSchema<
  Flavour extends string,
  State extends Record<string, unknown>,
  Methods extends (
    get: () => State,
    set: (props: Partial<State>) => void,
    $: {
      metadata: Metadata;
    }
  ) => Record<string, AnyFunction>,
  Metadata extends Readonly<{
    version: number;
    tag: StaticValue;
  }>
>(
  flavour: Flavour,
  state: State,
  methods: Methods,
  metadata: Metadata
): {
  version: number;
  model: {
    state: State;
    methods: Methods;
    flavour: Flavour;
  } & Metadata;
};
export function defineBlockSchema(
  state: Record<string, unknown>,
  methods: (...args: unknown[]) => Record<string, AnyFunction>,
  metadata: {
    version: number;
    flavour: string;
    tag: StaticValue;
  }
): z.infer<typeof BlockSchema> {
  const schema = {
    version: metadata.version,
    model: {
      flavour: metadata.flavour,
      tag: metadata.tag,
      state,
      methods,
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

  type!: string;
  children: BaseBlockModel[];
  // TODO use schema
  tags?: Y.Map<Y.Map<unknown>>;
  tagSchema?: Y.Map<unknown>;
  text?: TextType;
  sourceId?: string;

  parentIndex?: number;
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
