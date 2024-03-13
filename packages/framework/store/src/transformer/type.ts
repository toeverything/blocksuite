import { z } from 'zod';

import type { DocMeta, DocsPropertiesMeta } from '../store/meta.js';

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

export type CollectionInfoSnapshot = {
  id: string;
  type: 'info';
  pageVersion: number;
  workspaceVersion: number;
  properties: DocsPropertiesMeta;
};

export const CollectionInfoSnapshotSchema: z.ZodType<CollectionInfoSnapshot> =
  z.object({
    id: z.string(),
    type: z.literal('info'),
    pageVersion: z.number(),
    workspaceVersion: z.number(),
    properties: z.record(z.any()),
  });

export type DocSnapshot = {
  type: 'page';
  meta: DocMeta;
  blocks: BlockSnapshot;
};

const DocMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  createDate: z.number(),
  tags: z.array(z.string()),
});

export const DocSnapshotSchema: z.ZodType<DocSnapshot> = z.object({
  type: z.literal('page'),
  meta: DocMetaSchema,
  blocks: BlockSnapshotSchema,
});
