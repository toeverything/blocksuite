import { createEmbedBlockSchema } from '../../../utils/index.js';
import {
  type EmbedSyncedDocBlockProps,
  EmbedSyncedDocModel,
  EmbedSyncedDocStyles,
} from './synced-doc-model.js';

export const defaultEmbedSyncedDocBlockProps: EmbedSyncedDocBlockProps = {
  pageId: '',
  style: EmbedSyncedDocStyles[0],
  caption: undefined,
  scale: undefined,
  // title & description aliases
  title: undefined,
  description: undefined,
};

export const EmbedSyncedDocBlockSchema = createEmbedBlockSchema({
  name: 'synced-doc',
  version: 1,
  toModel: () => new EmbedSyncedDocModel(),
  props: (): EmbedSyncedDocBlockProps => defaultEmbedSyncedDocBlockProps,
});
