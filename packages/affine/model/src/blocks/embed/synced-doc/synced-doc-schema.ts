import { BlockSchemaExtension } from '@blocksuite/store';

import { createEmbedBlockSchema } from '../../../utils/index.js';
import {
  type EmbedSyncedDocBlockProps,
  EmbedSyncedDocModel,
  EmbedSyncedDocStyles,
} from './synced-doc-model.js';

export const SYNCED_MIN_WIDTH = 370;
export const SYNCED_MIN_HEIGHT = 64;

export const defaultEmbedSyncedDocBlockProps: EmbedSyncedDocBlockProps = {
  pageId: '',
  style: EmbedSyncedDocStyles[0],
  caption: undefined,
  scale: undefined,
  // title & description aliases
  title: undefined,
  description: undefined,
  index: 'a0',
  xywh: `[0,0,${SYNCED_MIN_WIDTH},100]`,
  lockedBySelf: undefined,
};

export const EmbedSyncedDocBlockSchema = createEmbedBlockSchema({
  name: 'synced-doc',
  version: 1,
  toModel: () => new EmbedSyncedDocModel(),
  props: (): EmbedSyncedDocBlockProps => defaultEmbedSyncedDocBlockProps,
});

export const EmbedSyncedDocBlockSchemaExtension = BlockSchemaExtension(
  EmbedSyncedDocBlockSchema
);
