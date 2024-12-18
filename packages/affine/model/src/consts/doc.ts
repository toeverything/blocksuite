import { z } from 'zod';

export type DocMode = 'edgeless' | 'page';

export const DocModes = ['edgeless', 'page'] as const;

/**
 * Custom title and description information.
 *
 * Supports the following blocks:
 *
 * 1. Inline View: `AffineReference` - title
 * 2. Card View: `EmbedLinkedDocBlock` - title & description
 * 3. Embed View: `EmbedSyncedDocBlock` - title
 */
export const AliasInfoSchema = z
  .object({
    title: z.string(),
    description: z.string(),
  })
  .partial();

export type AliasInfo = z.infer<typeof AliasInfoSchema>;

export const ReferenceParamsSchema = z
  .object({
    mode: z.enum(DocModes),
    blockIds: z.string().array(),
    elementIds: z.string().array(),
    databaseId: z.string().optional(),
    databaseRowId: z.string().optional(),
  })
  .partial();

export type ReferenceParams = z.infer<typeof ReferenceParamsSchema>;

export const ReferenceInfoSchema = z
  .object({
    pageId: z.string(),
    params: ReferenceParamsSchema.optional(),
  })
  .merge(AliasInfoSchema);

export type ReferenceInfo = z.infer<typeof ReferenceInfoSchema>;
