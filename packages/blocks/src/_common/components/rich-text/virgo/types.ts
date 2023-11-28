import type { DeltaInsert, VEditor } from '@blocksuite/virgo';
import { baseTextAttributes } from '@blocksuite/virgo';
import { z } from 'zod';

export const affineTextAttributes = baseTextAttributes.extend({
  reference: z
    .object({
      type: z.enum(['Subpage', 'LinkedPage']),
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

export type AffineVEditor = VEditor<AffineTextAttributes>;
