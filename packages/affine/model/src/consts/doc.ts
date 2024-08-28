import { z } from 'zod';

export enum DocMode {
  Edgeless = 'edgeless',
  Page = 'page',
}

export const DocModes: string[] = Object.values(DocMode);

export const ReferenceInfoSchema = z.object({
  pageId: z.string(),
  params: z
    .object({
      mode: z.nativeEnum(DocMode).optional(),
      blockIds: z.string().array().optional(),
      elementIds: z.string().array().optional(),
    })
    .optional(),
});

export type ReferenceInfo = z.infer<typeof ReferenceInfoSchema>;
