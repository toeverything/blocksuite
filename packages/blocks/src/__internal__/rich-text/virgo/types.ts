import type {
  AttributeRenderer,
  BaseTextAttributes,
  DeltaInsert,
  VEditor,
} from '@blocksuite/virgo';
import { baseTextAttributes } from '@blocksuite/virgo';
import { z, type ZodTypeDef } from 'zod';

import type { Config as LinkConfig } from '../link-node/affine-link.js';

export const affineTextAttributes = baseTextAttributes.extend({
  reference: z
    .object({
      type: z.enum(['Subpage', 'LinkedPage']),
      pageId: z.string(),
    })
    .optional(),
});

export type AffineTextAttributes = z.infer<typeof affineTextAttributes>;

export type AffineDeltaInsert = DeltaInsert<AffineTextAttributes>;

export type AffineVEditor = VEditor<AffineTextAttributes>;

type TextRendererConfig = {
  link: LinkConfig;
};

export type AffineTextSchema<
  TextAttributes extends BaseTextAttributes = AffineTextAttributes
> = {
  attributesSchema: z.ZodSchema<TextAttributes, ZodTypeDef, unknown>;
  textRenderer: (
    config?: TextRendererConfig
  ) => AttributeRenderer<TextAttributes>;
};
