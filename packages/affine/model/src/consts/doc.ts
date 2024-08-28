import { z } from 'zod';

export enum DocMode {
  Edgeless = 'edgeless',
  Page = 'page',
}

export const DocModes: readonly string[] = Object.values(DocMode);

export const ReferenceInfoSchema = z.object({
  pageId: z.string(),
  params: z
    .object({
      mode: z.nativeEnum(DocMode),
      blockIds: z.string().array(),
      elementIds: z.string().array(),
    })
    .partial()
    .optional(),
});

export type ReferenceInfo = z.infer<typeof ReferenceInfoSchema>;
