import { z } from 'zod';

export type DocMode = 'edgeless' | 'page';

export const DocModes = ['edgeless', 'page'] as const;

export const ReferenceParamsSchema = z
  .object({
    mode: z.enum(DocModes),
    blockIds: z.string().array(),
    elementIds: z.string().array(),
  })
  .partial();

export type ReferenceParams = z.infer<typeof ReferenceParamsSchema>;

export const ReferenceInfoSchema = z.object({
  pageId: z.string(),
  params: ReferenceParamsSchema.optional(),
});

export type ReferenceInfo = z.infer<typeof ReferenceInfoSchema>;
