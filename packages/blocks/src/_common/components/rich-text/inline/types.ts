import type { DeltaInsert, InlineEditor } from '@blocksuite/inline';
import { baseTextAttributes } from '@blocksuite/inline';
import { z } from 'zod';

export const affineTextAttributes = baseTextAttributes.extend({
  reference: z
    .object({
      type: z.enum([
        // @deprecated Subpage is deprecated, use LinkedPage instead
        'Subpage',
        'LinkedPage',
      ]),
      pageId: z.string(),
    })
    .optional()
    .nullable()
    .catch(undefined),
  background: z.string().optional().nullable().catch(undefined),
  color: z.string().optional().nullable().catch(undefined),
});

export type AffineTextAttributes = z.infer<typeof affineTextAttributes>;

export type AffineDeltaInsert = DeltaInsert<AffineTextAttributes>;

export type AffineInlineEditor = InlineEditor<AffineTextAttributes>;
