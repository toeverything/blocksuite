import { z } from 'zod';

export const baseTextAttributes = z.object({
  bold: z.literal(true).optional(),
  italic: z.literal(true).optional(),
  underline: z.literal(true).optional(),
  strike: z.literal(true).optional(),
  code: z.literal(true).optional(),
});

export type BaseTextAttributes = z.infer<typeof baseTextAttributes>;
