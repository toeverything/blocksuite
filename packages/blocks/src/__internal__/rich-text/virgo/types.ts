import type {
  AttributesRenderer,
  DeltaInsert,
  VEditor,
} from '@blocksuite/virgo';
import { baseTextAttributes } from '@blocksuite/virgo';
import { z, type ZodTypeDef } from 'zod';

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

export type AffineTextSchema = {
  attributesSchema: z.ZodSchema<AffineTextAttributes, ZodTypeDef, unknown>;
  textRenderer: AttributesRenderer<AffineTextAttributes>;
};
