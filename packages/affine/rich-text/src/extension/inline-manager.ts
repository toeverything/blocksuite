import type { AffineTextAttributes } from '@blocksuite/affine-shared/types';
import { type BlockStdScope, StdIdentifier } from '@blocksuite/block-std';
import {
  createIdentifier,
  type ServiceIdentifier,
} from '@blocksuite/global/di';
import {
  type AttributeRenderer,
  baseTextAttributes,
  type DeltaInsert,
  getDefaultAttributeRenderer,
} from '@blocksuite/inline';
import type { ExtensionType } from '@blocksuite/store';
import { z, type ZodObject, type ZodTypeAny } from 'zod';

import { MarkdownMatcherIdentifier } from './markdown-matcher.js';
import type { InlineMarkdownMatch, InlineSpecs } from './type.js';

export class InlineManager {
  embedChecker = (delta: DeltaInsert<AffineTextAttributes>) => {
    for (const spec of this.specs) {
      if (spec.embed && spec.match(delta)) {
        return true;
      }
    }
    return false;
  };

  getRenderer = (): AttributeRenderer<AffineTextAttributes> => {
    const defaultRenderer = getDefaultAttributeRenderer<AffineTextAttributes>();

    const renderer: AttributeRenderer<AffineTextAttributes> = props => {
      // Priority increases from front to back
      for (const spec of this.specs.toReversed()) {
        if (spec.match(props.delta)) {
          return spec.renderer(props);
        }
      }
      return defaultRenderer(props);
    };
    return renderer;
  };

  getSchema = (): ZodObject<Record<keyof AffineTextAttributes, ZodTypeAny>> => {
    const defaultSchema = baseTextAttributes as unknown as ZodObject<
      Record<keyof AffineTextAttributes, ZodTypeAny>
    >;

    const schema: ZodObject<Record<keyof AffineTextAttributes, ZodTypeAny>> =
      this.specs.reduce((acc, cur) => {
        const currentSchema = z.object({
          [cur.name]: cur.schema,
        }) as ZodObject<Record<keyof AffineTextAttributes, ZodTypeAny>>;
        return acc.merge(currentSchema) as ZodObject<
          Record<keyof AffineTextAttributes, ZodTypeAny>
        >;
      }, defaultSchema);
    return schema;
  };

  readonly specs: Array<InlineSpecs<AffineTextAttributes>>;

  constructor(
    readonly std: BlockStdScope,
    readonly markdownMatches: InlineMarkdownMatch<AffineTextAttributes>[],
    ...specs: Array<InlineSpecs<AffineTextAttributes>>
  ) {
    this.specs = specs;
  }
}

export const InlineManagerIdentifier = createIdentifier<InlineManager>(
  'AffineInlineManager'
);

export type InlineManagerExtensionConfig = {
  id: string;
  enableMarkdown?: boolean;
  specs: ServiceIdentifier<InlineSpecs<AffineTextAttributes>>[];
};

export function InlineManagerExtension({
  id,
  enableMarkdown = true,
  specs,
}: InlineManagerExtensionConfig): ExtensionType & {
  identifier: ServiceIdentifier<InlineManager>;
} {
  const identifier = InlineManagerIdentifier(id);
  return {
    setup: di => {
      di.addImpl(identifier, provider => {
        return new InlineManager(
          provider.get(StdIdentifier),
          enableMarkdown
            ? Array.from(provider.getAll(MarkdownMatcherIdentifier).values())
            : [],
          ...specs.map(spec => provider.get(spec))
        );
      });
    },
    identifier,
  };
}
