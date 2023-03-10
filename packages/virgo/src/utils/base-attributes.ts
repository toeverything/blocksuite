import { z } from 'zod';

export const baseTextAttributes = z.object({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strike: z.boolean().optional(),
  code: z.boolean().optional(),
});

export type BaseTextAttributes = z.infer<typeof baseTextAttributes>;
