import type { Page } from './workspace/index.js';
import type { TextType } from './text-adapter.js';
import { Signal } from '@blocksuite/global/utils';
import type * as Y from 'yjs';
import { z } from 'zod';

const FlavourSchema = z.string();
const TagSchema = z.string();
const PropsSchema = z.record(z.any());
const MethodSchema = z.function(z.tuple([]).rest(z.any()));
const SetFunctionSchema = z.function(z.tuple([z.record(z.any())]));
const GetFunctionSchema = z.function(z.tuple([])).returns(PropsSchema);
const MethodsSchema = z
  .function()
  .args(GetFunctionSchema, SetFunctionSchema)
  .returns(z.record(MethodSchema));

export const BlockSchema = z.object({
  version: z.number(),
  model: z.object({
    flavour: FlavourSchema,
    tag: TagSchema,
    defaultProps: PropsSchema,
    methods: MethodsSchema,
  }),
});

type AnyFunction = (...args: any[]) => any;
type VoidFunction = () => void;
type Listener<State> = (state: State, prevState: State) => void;
// @ts-expect-error
type Subscribe<State> = (listener: Listener<State>) => VoidFunction;

export function defineBlockSchema<
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
    flavour: string;
    tag: string;
  }>
>(
  state: Partial<State>,
  methods: Methods,
  metadata: Metadata
): z.infer<typeof BlockSchema>;
export function defineBlockSchema(
  defaultProps: Record<string, unknown>,
  methods: (...args: unknown[]) => Record<string, AnyFunction>,
  metadata: {
    version: number;
    flavour: string;
    tag: string;
  }
): unknown {
  const schema = {
    version: metadata.version,
    model: {
      flavour: metadata.flavour,
      tag: metadata.flavour,
      defaultProps,
      methods,
    },
  } satisfies z.infer<typeof BlockSchema>;
  BlockSchema.parse(schema);
  return schema;
}

// ported from lit
interface StaticValue {
  _$litStatic$: string;
  r: unknown;
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
