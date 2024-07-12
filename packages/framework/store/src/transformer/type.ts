import { z } from 'zod';

import type { DocMeta, DocsPropertiesMeta } from '../store/meta.js';

export type BlockSnapshot = {
  children: BlockSnapshot[];
  flavour: string;
  id: string;
  props: Record<string, unknown>;
  type: 'block';
  version?: number;
};

export const BlockSnapshotSchema: z.ZodType<BlockSnapshot> = z.object({
  children: z.lazy(() => BlockSnapshotSchema.array()),
  flavour: z.string(),
  id: z.string(),
  props: z.record(z.unknown()),
  type: z.literal('block'),
  version: z.number().optional(),
});

export type SliceSnapshot = {
  content: BlockSnapshot[];
  pageId: string;
  pageVersion: number;
  type: 'slice';
  workspaceId: string;
  workspaceVersion: number;
};

export const SliceSnapshotSchema: z.ZodType<SliceSnapshot> = z.object({
  content: BlockSnapshotSchema.array(),
  pageId: z.string(),
  pageVersion: z.number(),
  type: z.literal('slice'),
  workspaceId: z.string(),
  workspaceVersion: z.number(),
});

export type CollectionInfoSnapshot = {
  id: string;
  pageVersion: number;
  properties: DocsPropertiesMeta;
  type: 'info';
  workspaceVersion: number;
};

export const CollectionInfoSnapshotSchema: z.ZodType<CollectionInfoSnapshot> =
  z.object({
    id: z.string(),
    pageVersion: z.number(),
    properties: z.record(z.any()),
    type: z.literal('info'),
    workspaceVersion: z.number(),
  });

export type DocSnapshot = {
  blocks: BlockSnapshot;
  meta: DocMeta;
  type: 'page';
};

const DocMetaSchema = z.object({
  createDate: z.number(),
  id: z.string(),
  tags: z.array(z.string()),
  title: z.string(),
});

export const DocSnapshotSchema: z.ZodType<DocSnapshot> = z.object({
  blocks: BlockSnapshotSchema,
  meta: DocMetaSchema,
  type: z.literal('page'),
});
