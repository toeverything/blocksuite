import { z } from 'zod';

import type { PageMeta, PagesPropertiesMeta } from '../workspace/meta.js';

export type BlockSnapshot = {
  type: 'block';
  id: string;
  flavour: string;
  version?: number;
  props: Record<string, unknown>;
  children: BlockSnapshot[];
};

export const BlockSnapshotSchema: z.ZodType<BlockSnapshot> = z.object({
  type: z.literal('block'),
  id: z.string(),
  flavour: z.string(),
  version: z.number().optional(),
  props: z.record(z.unknown()),
  children: z.lazy(() => BlockSnapshotSchema.array()),
});

export type SliceSnapshot = {
  type: 'slice';
  content: BlockSnapshot[];
  pageVersion: number;
  workspaceVersion: number;
  workspaceId: string;
  pageId: string;
};

export const SliceSnapshotSchema: z.ZodType<SliceSnapshot> = z.object({
  type: z.literal('slice'),
  content: BlockSnapshotSchema.array(),
  pageVersion: z.number(),
  workspaceVersion: z.number(),
  workspaceId: z.string(),
  pageId: z.string(),
});

export type WorkspaceInfoSnapshot = {
  id: string;
  type: 'info';
  pageVersion: number;
  workspaceVersion: number;
  properties: PagesPropertiesMeta;
};

export const WorkspaceInfoSnapshotSchema: z.ZodType<WorkspaceInfoSnapshot> =
  z.object({
    id: z.string(),
    type: z.literal('info'),
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
