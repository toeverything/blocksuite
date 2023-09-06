import { z } from 'zod';

import type { PageMeta, PagesPropertiesMeta } from '../workspace/meta.js';

export type BlockSnapshot = {
  type: 'snapshot:block';
  id: string;
  flavour: string;
  props: Record<string, unknown>;
  children: BlockSnapshot[];
};

export const BlockSnapshotSchema: z.ZodType<BlockSnapshot> = z.object({
  type: z.literal('snapshot:block'),
  id: z.string(),
  flavour: z.string(),
  props: z.record(z.unknown()),
  children: z.lazy(() => BlockSnapshotSchema.array()),
});

export type PageSnapshot = {
  type: 'snapshot:page';
  meta: {
    page: PageMeta;
    versions: {
      block: Record<string, number>;
      page: number;
    };
    properties: PagesPropertiesMeta;
  };
  block: BlockSnapshot;
};

const PageMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  createDate: z.number(),
  tags: z.array(z.string()),
});

export const PageSnapshotSchema: z.ZodType<PageSnapshot> = z.object({
  type: z.literal('snapshot:page'),
  meta: z.object({
    page: PageMetaSchema,
    versions: z.object({
      block: z.record(z.number()),
      page: z.number(),
    }),
    properties: z.record(z.any()),
  }),
  block: BlockSnapshotSchema,
});

export type WorkspaceMetaSnapshot = {
  type: 'snapshot:workspace';
  workspaceVersion: number;
  properties: PagesPropertiesMeta;
  pages: PageMeta[];
};

export const WorkspaceSnapshotSchema: z.ZodType<WorkspaceMetaSnapshot> =
  z.object({
    type: z.literal('snapshot:workspace'),
    workspaceVersion: z.number(),
    pages: z.array(PageMetaSchema),
    properties: z.record(z.any()),
  });
