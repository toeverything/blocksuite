import type { DeltaInsert, VEditor } from '@blocksuite/virgo';
import { baseTextAttributes } from '@blocksuite/virgo';
import type { z } from 'zod';

export const affineTextAttributes = baseTextAttributes.extend({});

export type AffineTextAttributes = z.infer<typeof affineTextAttributes>;

export type AffineDeltaInsert = DeltaInsert<AffineTextAttributes>;

export type AffineVEditor = VEditor<AffineTextAttributes>;
