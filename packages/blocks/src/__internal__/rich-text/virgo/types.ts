import { z } from 'zod';

import type { AffineLink } from '../link-node/index.js';
import type { AffineText } from './affine-text.js';

export const affineTextAttributes = z.object({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strike: z.boolean().optional(),
  code: z.boolean().optional(),
  link: z.string().optional(),
});

export type AffineTextAttributes = z.infer<typeof affineTextAttributes>;

declare module '@blocksuite/virgo' {
  interface CustomTypes {
    Attributes: AffineTextAttributes;
    Element: AffineText | AffineLink;
  }
}
