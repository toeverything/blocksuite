import { z } from 'zod';

import type { PagesPropertiesMeta } from '../workspace/meta.js';

export type BlockSnapshot = {
  id: string;
  flavour: string;
  props: Record<string, unknown>;
  children: BlockSnapshot[];
};

export const BlockSnapshotSchema: z.ZodType<BlockSnapshot> = z.object({
  id: z.string(),
  flavour: z.string(),
  props: z.record(z.unknown()),
  children: z.lazy(() => BlockSnapshotSchema.array()),
});

export type PageSnapshot = {
  meta: {
    page: {
      id: string;
      title: string;
      createDate: number;
      tags: string[];
    };
    versions?: {
      block: Record<string, number>;
      page: number;
    };
    properties: PagesPropertiesMeta;
  };
  block: BlockSnapshot;
};

export const PageSnapshotSchema: z.ZodType<PageSnapshot> = z.object({
  meta: z.object({
    page: z.object({
      id: z.string(),
      title: z.string(),
      createDate: z.number(),
      tags: z.array(z.string()),
    }),
    versions: z
      .object({
        block: z.record(z.number()),
        page: z.number(),
      })
      .optional(),
    properties: z.record(z.any()),
  }),
  block: BlockSnapshotSchema,
});
