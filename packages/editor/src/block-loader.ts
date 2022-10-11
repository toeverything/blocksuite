// Use manual per-module import/export to support vitest environment on Node.js
import { PageBlockModel } from '@blocksuite/blocks/src/page-block/page-model';
import { ParagraphBlockModel } from '@blocksuite/blocks/src/paragraph-block/paragraph-model';
import { ListBlockModel } from '@blocksuite/blocks/src/list-block/list-model';
import { GroupBlockModel } from '@blocksuite/blocks/src/group-block/group-model';

export type { ParagraphBlockProps as TextBlockProps } from '@blocksuite/blocks/src/paragraph-block/paragraph-model';

// TODO support dynamic register
export const BlockSchema = {
  paragraph: ParagraphBlockModel,
  page: PageBlockModel,
  list: ListBlockModel,
  group: GroupBlockModel,
} as const;
