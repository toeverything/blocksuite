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

export type WorkspaceInfoSnapshot = {
  id: string;
  app: '@toeverything/blocksuite';
  source: 'github.com/toeverything/blocksuite';
  type: 'snapshot:workspace:info';
  blockVersions: Record<string, number>;
  pageVersion: number;
  workspaceVersion: number;
  properties: PagesPropertiesMeta;
};

export const WorkspaceInfoSnapshotSchema: z.ZodType<WorkspaceInfoSnapshot> =
  z.object({
    id: z.string(),
    app: z.literal('@toeverything/blocksuite'),
    source: z.literal('github.com/toeverything/blocksuite'),
    type: z.literal('snapshot:workspace:info'),
    blockVersions: z.record(z.number()),
    pageVersion: z.number(),
    workspaceVersion: z.number(),
    properties: z.record(z.any()),
  });

export type PageSnapshot = {
  type: 'snapshot:page';
  meta: PageMeta;
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
  meta: PageMetaSchema,
  block: BlockSnapshotSchema,
});
