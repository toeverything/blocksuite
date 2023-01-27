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

const FeaturesSchema = z.object({
  enableText: z.boolean(),
});

export type ModelFeatures = z.infer<typeof FeaturesSchema>;

export const BlockSchema = z.object({
  version: z.number(),
  model: z.object({
    flavour: FlavourSchema,
    tag: TagSchema,
    state: z.function().returns(z.record(z.any())),
    features: FeaturesSchema,
  }),
});

// ported from lit
interface StaticValue {
  _$litStatic$: string;
  r: symbol;
}

export type SchemaToModel<
  Schema extends {
    model: {
      state: () => Record<string, unknown>;
      flavour: string;
      features: ModelFeatures;
    };
  }
> = BaseBlockModel &
  ReturnType<Schema['model']['state']> & {
    flavour: Schema['model']['flavour'];
  } & {
    text: Schema['model']['features']['enableText'] extends true
      ? TextType
      : never;
  };

const defaultFeatures: ModelFeatures = {
  enableText: false,
};

export function defineBlockSchema<
  Flavour extends string,
  State extends Record<string, unknown>,
  Metadata extends Readonly<{
    version: number;
    tag: StaticValue;
  }>,
  Features extends ModelFeatures
>(
  flavour: Flavour,
  state: () => State,
  metadata: Metadata,
  features?: Partial<Features>
): {
  version: number;
  model: {
    state: () => State;
    flavour: Flavour;
    features: Features;
  } & Metadata;
};
export function defineBlockSchema(
  flavour: string,
  state: () => Record<string, unknown>,
  metadata: {
    version: number;
    tag: StaticValue;
  },
  features?: Partial<ModelFeatures>
): z.infer<typeof BlockSchema> {
  const schema = {
    version: metadata.version,
    model: {
      flavour,
      tag: metadata.tag,
      state,
      features: {
        ...defaultFeatures,
        ...(features ?? {}),
      },
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
