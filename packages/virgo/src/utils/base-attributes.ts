import { z } from 'zod';

export const baseTextAttributes = z.object({
  bold: z.literal(true).optional().catch(undefined),
  italic: z.literal(true).optional().catch(undefined),
  underline: z.literal(true).optional().catch(undefined),
  strike: z.literal(true).optional().catch(undefined),
  code: z.literal(true).optional().catch(undefined),
  link: z.string().optional().catch(undefined),
});
// .partial();

export type BaseTextAttributes = z.infer<typeof baseTextAttributes>;
