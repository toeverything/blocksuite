import { z } from 'zod';

export type DocMode = 'edgeless' | 'page';

export const DocModes = ['edgeless', 'page'] as const;

export const ReferenceInfoSchema = z.object({
  pageId: z.string(),
  params: z
    .object({
      mode: z.enum(DocModes),
      blockIds: z.string().array(),
      elementIds: z.string().array(),
    })
    .partial()
    .optional(),
});

export type ReferenceInfo = z.infer<typeof ReferenceInfoSchema>;
