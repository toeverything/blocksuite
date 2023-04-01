import type {
  AttributeRenderer,
  BaseTextAttributes,
  DeltaInsert,
  VEditor,
} from '@blocksuite/virgo';
import { baseTextAttributes } from '@blocksuite/virgo';
import { z, type ZodTypeDef } from 'zod';

import type { BlockHost } from '../../index.js';

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

export type AffineTextSchema<
  TextAttributes extends BaseTextAttributes = AffineTextAttributes
> = {
  attributesSchema: z.ZodSchema<TextAttributes, ZodTypeDef, unknown>;
  textRenderer: (host: BlockHost) => AttributeRenderer<TextAttributes>;
};
