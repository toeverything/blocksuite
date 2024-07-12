import { createEmbedBlockSchema } from '../_common/embed-block-helper/helper.js';
import {
  type EmbedSyncedDocBlockProps,
  EmbedSyncedDocModel,
  EmbedSyncedDocStyles,
} from './embed-synced-doc-model.js';

export const defaultEmbedSyncedDocBlockProps: EmbedSyncedDocBlockProps = {
  caption: undefined,
  pageId: '',
  scale: undefined,
  style: EmbedSyncedDocStyles[0],
};

export const EmbedSyncedDocBlockSchema = createEmbedBlockSchema({
  name: 'synced-doc',
  props: (): EmbedSyncedDocBlockProps => defaultEmbedSyncedDocBlockProps,
  toModel: () => new EmbedSyncedDocModel(),
  version: 1,
});
