import type { DeltaInsert, VEditor } from '@blocksuite/virgo';
import { baseTextAttributes } from '@blocksuite/virgo';
import { z } from 'zod';

export const affineTextAttributes = baseTextAttributes.extend({
  linkedPage: z
    .object({
      type: z.enum(['Subpage', 'LinkedPage']),
      pageId: z.string(),
    })
    .optional(),
});

export type AffineTextAttributes = z.infer<typeof affineTextAttributes>;

export type AffineDeltaInsert = DeltaInsert<AffineTextAttributes>;

export type AffineVEditor = VEditor<AffineTextAttributes>;
