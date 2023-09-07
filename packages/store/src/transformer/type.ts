import { z } from 'zod';

import type { PageMeta, PagesPropertiesMeta } from '../workspace/meta.js';

export type BlockSnapshot = {
  type: 'block';
  id: string;
  flavour: string;
  props: Record<string, unknown>;
  children: BlockSnapshot[];
};

export const BlockSnapshotSchema: z.ZodType<BlockSnapshot> = z.object({
  type: z.literal('block'),
  id: z.string(),
  flavour: z.string(),
  props: z.record(z.unknown()),
  children: z.lazy(() => BlockSnapshotSchema.array()),
});

export type WorkspaceInfoSnapshot = {
  id: string;
  type: 'info';
  blockVersions: Record<string, number>;
  pageVersion: number;
  workspaceVersion: number;
  properties: PagesPropertiesMeta;
};

export const WorkspaceInfoSnapshotSchema: z.ZodType<WorkspaceInfoSnapshot> =
  z.object({
    id: z.string(),
    type: z.literal('info'),
    blockVersions: z.record(z.number()),
    pageVersion: z.number(),
    workspaceVersion: z.number(),
    properties: z.record(z.any()),
  });

export type PageSnapshot = {
  type: 'page';
  meta: PageMeta;
  blocks: BlockSnapshot;
};

const PageMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  createDate: z.number(),
  tags: z.array(z.string()),
});

export const PageSnapshotSchema: z.ZodType<PageSnapshot> = z.object({
  type: z.literal('page'),
  meta: PageMetaSchema,
  blocks: BlockSnapshotSchema,
});
